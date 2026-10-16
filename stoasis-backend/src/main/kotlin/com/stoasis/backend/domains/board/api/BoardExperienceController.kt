package com.stoasis.backend.domains.board.api

import com.stoasis.backend.domains.board.application.BoardExperienceService
import com.stoasis.backend.shared.security.CurrentUser
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/collections/{collectionId}/experience")
class BoardExperienceController(private val service: BoardExperienceService, private val currentUser: CurrentUser) {
    @GetMapping
    fun list(@PathVariable collectionId: String) = service.list(collectionId, currentUser.id())

    @PostMapping("/paths")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@PathVariable collectionId: String, @RequestBody request: SavePresentationPathRequest) =
        service.savePath(collectionId, currentUser.id(), null, request)

    @PutMapping("/paths/{pathId}")
    fun update(@PathVariable collectionId: String, @PathVariable pathId: String, @RequestBody request: SavePresentationPathRequest) =
        service.savePath(collectionId, currentUser.id(), pathId, request)

    @DeleteMapping("/paths/{pathId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable collectionId: String, @PathVariable pathId: String) = service.deletePath(collectionId, currentUser.id(), pathId)

    @PutMapping("/dates/{pinId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun date(@PathVariable collectionId: String, @PathVariable pinId: String, @RequestBody request: SavePinDateRequest) =
        service.saveDate(collectionId, currentUser.id(), pinId, request)
}
