package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.*
import com.stoasis.backend.domains.collection.api.CreateCollectionRequest
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.api.CreatePinRequest
import com.stoasis.backend.domains.pin.api.UpdatePinRequest
import com.stoasis.backend.domains.pin.api.UpdateGridBlockRequest
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper

@Service
class BoardTemplateService(
    private val collections: CollectionService,
    private val pins: PinService,
    private val elements: BoardElementService,
    private val mapper: ObjectMapper,
) {
    @Transactional
    fun create(userId: String, request: CreateTemplateBoardRequest): com.stoasis.backend.domains.collection.api.CollectionDetail {
        val template = BoardTemplateCatalog.templates.find { it.id == request.templateId }
            ?: throw ApiException(HttpStatus.BAD_REQUEST, "Unbekannte Board-Vorlage.")
        val board = collections.create(userId, CreateCollectionRequest(
            request.name, request.emoji, setOf(PinType.note, PinType.link, PinType.photo),
        ))
        template.sections.forEachIndexed { index, section ->
            val x = 2 + index * 22
            elements.createZone(board.id, userId, CreateSoftZoneRequest(x, 7, 20, 42, section.color, section.title(request.language)))
            elements.createLabel(board.id, userId, CreateFloatingLabelRequest(x, 2, 4, "%02d".format(index + 1), 10))
            val pin = pins.create(board.id, userId, CreatePinRequest(
                type = PinType.note, color = section.color,
                data = mapper.valueToTree(mapOf("title" to section.title(request.language), "content" to BoardTemplateCatalog.prompt(request.language), "color" to "white")),
            ))
            pins.update(board.id, pin.id, userId, UpdatePinRequest(grid = UpdateGridBlockRequest(x + 2, 12, 20, index + 1)))
        }
        elements.createSticker(board.id, userId, CreateStickerRequest(
            motif = template.motif, colorVariant = template.sections.first().color,
            x = 28.0, y = 728.0, widthClips = 4.0, heightClips = 4.0, rotation = -8.0, layer = 20,
        ))
        return collections.detail(board.id, userId)
    }
}
