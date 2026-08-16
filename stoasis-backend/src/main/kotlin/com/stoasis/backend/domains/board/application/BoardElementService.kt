package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.BoardElementsDto
import com.stoasis.backend.domains.board.api.ConnectorThreadDto
import com.stoasis.backend.domains.board.api.CreateConnectorRequest
import com.stoasis.backend.domains.board.api.CreateFloatingLabelRequest
import com.stoasis.backend.domains.board.api.CreateSoftZoneRequest
import com.stoasis.backend.domains.board.api.CreateStackRequest
import com.stoasis.backend.domains.board.api.CreateStickerRequest
import com.stoasis.backend.domains.board.api.FloatingLabelDto
import com.stoasis.backend.domains.board.api.ReleaseStackChildRequest
import com.stoasis.backend.domains.board.api.SoftZoneDto
import com.stoasis.backend.domains.board.api.StackBlockDto
import com.stoasis.backend.domains.board.api.StickerElementDto
import com.stoasis.backend.domains.board.api.UpdateFloatingLabelRequest
import com.stoasis.backend.domains.board.api.UpdateSoftZoneRequest
import com.stoasis.backend.domains.board.api.UpdateStackRequest
import com.stoasis.backend.domains.board.api.UpdateStickerRequest
import org.springframework.stereotype.Service

@Service
class BoardElementService(
    private val query: BoardElementQueryService,
    private val stacks: BoardStackService,
    private val connectors: BoardConnectorService,
    private val decorations: BoardDecorationService,
) {
    companion object {
        const val CLIP_SIZE_PX = 14.0
    }

    fun list(collectionId: String, userId: String): BoardElementsDto = query.list(collectionId, userId)

    fun createStack(collectionId: String, userId: String, request: CreateStackRequest): StackBlockDto =
        stacks.createStack(collectionId, userId, request)

    fun addStackChild(collectionId: String, stackId: String, pinId: String, userId: String): StackBlockDto =
        stacks.addStackChild(collectionId, stackId, pinId, userId)

    fun updateStack(
        collectionId: String,
        stackId: String,
        userId: String,
        request: UpdateStackRequest,
    ): StackBlockDto = stacks.updateStack(collectionId, stackId, userId, request)

    fun releaseStackChild(
        collectionId: String,
        stackId: String,
        userId: String,
        request: ReleaseStackChildRequest,
    ): BoardElementsDto = stacks.releaseStackChild(collectionId, stackId, userId, request)

    fun dissolveStack(collectionId: String, stackId: String, userId: String): BoardElementsDto =
        stacks.dissolveStack(collectionId, stackId, userId)

    fun createConnector(
        collectionId: String,
        userId: String,
        request: CreateConnectorRequest,
    ): ConnectorThreadDto = connectors.createConnector(collectionId, userId, request)

    fun deleteConnector(collectionId: String, connectorId: String, userId: String) =
        connectors.deleteConnector(collectionId, connectorId, userId)

    fun createZone(collectionId: String, userId: String, request: CreateSoftZoneRequest): SoftZoneDto =
        decorations.createZone(collectionId, userId, request)

    fun updateZone(
        collectionId: String,
        zoneId: String,
        userId: String,
        request: UpdateSoftZoneRequest,
    ): SoftZoneDto = decorations.updateZone(collectionId, zoneId, userId, request)

    fun deleteZone(collectionId: String, zoneId: String, userId: String) =
        decorations.deleteZone(collectionId, zoneId, userId)

    fun createLabel(
        collectionId: String,
        userId: String,
        request: CreateFloatingLabelRequest,
    ): FloatingLabelDto = decorations.createLabel(collectionId, userId, request)

    fun updateLabel(
        collectionId: String,
        labelId: String,
        userId: String,
        request: UpdateFloatingLabelRequest,
    ): FloatingLabelDto = decorations.updateLabel(collectionId, labelId, userId, request)

    fun deleteLabel(collectionId: String, labelId: String, userId: String) =
        decorations.deleteLabel(collectionId, labelId, userId)

    fun createSticker(
        collectionId: String,
        userId: String,
        request: CreateStickerRequest,
    ): StickerElementDto = decorations.createSticker(collectionId, userId, request)

    fun updateSticker(
        collectionId: String,
        stickerId: String,
        userId: String,
        request: UpdateStickerRequest,
    ): StickerElementDto = decorations.updateSticker(collectionId, stickerId, userId, request)

    fun deleteSticker(collectionId: String, stickerId: String, userId: String) =
        decorations.deleteSticker(collectionId, stickerId, userId)
}
