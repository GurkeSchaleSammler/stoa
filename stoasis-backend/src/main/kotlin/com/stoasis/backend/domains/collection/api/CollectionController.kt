package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.application.CollectionService
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/collections")
class CollectionController(
    private val collections: CollectionService,
    private val currentUser: CurrentUser,
) {
    @GetMapping
    fun list(@RequestParam(defaultValue = "all") filter: String) = collections.list(currentUser.id(), filter)

    @GetMapping("/{id}")
    fun detail(@PathVariable id: String) = collections.detail(id, currentUser.id())

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateCollectionRequest) = collections.create(currentUser.id(), request)

    @PatchMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody request: UpdateCollectionRequest) =
        collections.update(id, currentUser.id(), request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) = collections.delete(id, currentUser.id())

}
