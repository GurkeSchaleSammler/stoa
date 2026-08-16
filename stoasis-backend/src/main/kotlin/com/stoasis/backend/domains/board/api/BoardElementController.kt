package com.stoasis.backend.domains.board.api

import com.stoasis.backend.domains.board.application.BoardElementService
import com.stoasis.backend.shared.security.CurrentUser
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
@RequestMapping("/api/collections/{collectionId}/board-elements")
class BoardElementController(
    private val elements: BoardElementService,
    private val currentUser: CurrentUser,
) {
    @GetMapping
    fun list(@PathVariable collectionId: String) = elements.list(collectionId, currentUser.id())

    @PostMapping("/stacks")
    @ResponseStatus(HttpStatus.CREATED)
    fun createStack(@PathVariable collectionId: String, @RequestBody request: CreateStackRequest) =
        elements.createStack(collectionId, currentUser.id(), request)

    @PostMapping("/stacks/{stackId}/children/{pinId}")
    fun addStackChild(
        @PathVariable collectionId: String,
        @PathVariable stackId: String,
        @PathVariable pinId: String,
    ) = elements.addStackChild(collectionId, stackId, pinId, currentUser.id())

    @PatchMapping("/stacks/{stackId}")
    fun updateStack(
        @PathVariable collectionId: String,
        @PathVariable stackId: String,
        @RequestBody request: UpdateStackRequest,
    ) = elements.updateStack(collectionId, stackId, currentUser.id(), request)

    @PostMapping("/stacks/{stackId}/release")
    fun releaseStackChild(
        @PathVariable collectionId: String,
        @PathVariable stackId: String,
        @RequestBody request: ReleaseStackChildRequest,
    ) = elements.releaseStackChild(collectionId, stackId, currentUser.id(), request)

    @DeleteMapping("/stacks/{stackId}")
    fun dissolveStack(@PathVariable collectionId: String, @PathVariable stackId: String) =
        elements.dissolveStack(collectionId, stackId, currentUser.id())

    @PostMapping("/connectors")
    @ResponseStatus(HttpStatus.CREATED)
    fun createConnector(@PathVariable collectionId: String, @RequestBody request: CreateConnectorRequest) =
        elements.createConnector(collectionId, currentUser.id(), request)

    @DeleteMapping("/connectors/{connectorId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteConnector(@PathVariable collectionId: String, @PathVariable connectorId: String) =
        elements.deleteConnector(collectionId, connectorId, currentUser.id())

    @PostMapping("/zones")
    @ResponseStatus(HttpStatus.CREATED)
    fun createZone(@PathVariable collectionId: String, @RequestBody request: CreateSoftZoneRequest) =
        elements.createZone(collectionId, currentUser.id(), request)

    @PatchMapping("/zones/{zoneId}")
    fun updateZone(
        @PathVariable collectionId: String,
        @PathVariable zoneId: String,
        @RequestBody request: UpdateSoftZoneRequest,
    ) = elements.updateZone(collectionId, zoneId, currentUser.id(), request)

    @DeleteMapping("/zones/{zoneId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteZone(@PathVariable collectionId: String, @PathVariable zoneId: String) =
        elements.deleteZone(collectionId, zoneId, currentUser.id())

    @PostMapping("/labels")
    @ResponseStatus(HttpStatus.CREATED)
    fun createLabel(@PathVariable collectionId: String, @RequestBody request: CreateFloatingLabelRequest) =
        elements.createLabel(collectionId, currentUser.id(), request)

    @PatchMapping("/labels/{labelId}")
    fun updateLabel(
        @PathVariable collectionId: String,
        @PathVariable labelId: String,
        @RequestBody request: UpdateFloatingLabelRequest,
    ) = elements.updateLabel(collectionId, labelId, currentUser.id(), request)

    @DeleteMapping("/labels/{labelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteLabel(@PathVariable collectionId: String, @PathVariable labelId: String) =
        elements.deleteLabel(collectionId, labelId, currentUser.id())

    @PostMapping("/stickers")
    @ResponseStatus(HttpStatus.CREATED)
    fun createSticker(@PathVariable collectionId: String, @RequestBody request: CreateStickerRequest) =
        elements.createSticker(collectionId, currentUser.id(), request)

    @PatchMapping("/stickers/{stickerId}")
    fun updateSticker(
        @PathVariable collectionId: String,
        @PathVariable stickerId: String,
        @RequestBody request: UpdateStickerRequest,
    ) = elements.updateSticker(collectionId, stickerId, currentUser.id(), request)

    @DeleteMapping("/stickers/{stickerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteSticker(@PathVariable collectionId: String, @PathVariable stickerId: String) =
        elements.deleteSticker(collectionId, stickerId, currentUser.id())
}
