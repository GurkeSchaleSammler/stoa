package com.stoasis.backend.domains.world.api

import com.stoasis.backend.domains.world.application.WorldService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/worlds")
class WorldController(private val worlds: WorldService, private val currentUser: CurrentUser) {
    @GetMapping fun list() = worlds.list(currentUser.id())
    @GetMapping("/for-board/{collectionId}")
    fun forBoard(@PathVariable collectionId: String) = worlds.forBoard(collectionId, currentUser.id())
    @GetMapping("/{id}") fun detail(@PathVariable id: String) = worlds.detail(id, currentUser.id())

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateWorldRequest) = worlds.create(currentUser.id(), request)

    @PatchMapping("/{id}")
    fun update(@PathVariable id: String, @Valid @RequestBody request: UpdateWorldRequest) =
        worlds.update(id, currentUser.id(), request)

    @PostMapping("/{id}/boards")
    fun addBoard(@PathVariable id: String, @Valid @RequestBody request: AddWorldBoardRequest) =
        worlds.addBoard(id, currentUser.id(), request)

    @DeleteMapping("/{id}/boards/{collectionId}")
    fun removeBoard(@PathVariable id: String, @PathVariable collectionId: String) =
        worlds.removeBoard(id, collectionId, currentUser.id())

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) = worlds.delete(id, currentUser.id())
}
