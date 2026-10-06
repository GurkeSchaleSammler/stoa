package com.stoasis.backend.domains.pin.api

import com.stoasis.backend.domains.pin.application.PinService
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
@RequestMapping("/api/collections/{collectionId}/pins")
class PinController(
    private val pins: PinService,
    private val copies: com.stoasis.backend.domains.pin.application.PinCopyService,
    private val currentUser: CurrentUser,
) {
    @PostMapping("/copy")
    @ResponseStatus(HttpStatus.CREATED)
    fun copy(@PathVariable collectionId: String, @Valid @RequestBody request: CopyPinRequest) =
        copies.copy(request.sourceCollectionId, request.pinId, collectionId, currentUser.id())

    @GetMapping
    fun list(@PathVariable collectionId: String) = pins.list(collectionId, currentUser.id())

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@PathVariable collectionId: String, @RequestBody request: CreatePinRequest) =
        pins.create(collectionId, currentUser.id(), request)

    @PatchMapping("/{pinId}")
    fun update(
        @PathVariable collectionId: String,
        @PathVariable pinId: String,
        @RequestBody request: UpdatePinRequest,
    ) = pins.update(collectionId, pinId, currentUser.id(), request)

    @DeleteMapping("/{pinId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable collectionId: String, @PathVariable pinId: String) =
        pins.delete(collectionId, pinId, currentUser.id())

    @PostMapping("/{pinId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    fun addComment(
        @PathVariable collectionId: String,
        @PathVariable pinId: String,
        @Valid @RequestBody request: AddCommentRequest,
    ) = pins.addComment(collectionId, pinId, currentUser.id(), request)
}
