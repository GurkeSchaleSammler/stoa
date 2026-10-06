package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.data.*
import com.stoasis.backend.domains.collection.api.CreateCollectionRequest
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.pin.application.PinCopyService
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Atomic private fork, including the full spatial graph but excluding sharing and discussions. */
@Service
class BoardCopyService(
    private val collections: CollectionService,
    private val pins: PinCopyService,
    private val support: BoardElementSupport,
    private val stacks: PinStackRepository,
    private val connectors: BoardConnectorRepository,
    private val zones: SoftZoneRepository,
    private val labels: FloatingLabelRepository,
    private val stickers: StickerRepository,
    private val ids: IdGenerator,
) {
    @Transactional
    fun duplicate(sourceId: String, userId: String, name: String): com.stoasis.backend.domains.collection.api.CollectionDetail {
        val source = collections.lock(sourceId)
        if (collections.roleOf(source, userId) == null || source.isSystem) {
            throw ApiException(HttpStatus.NOT_FOUND, "Board nicht verfügbar.")
        }
        val result = collections.create(userId, CreateCollectionRequest(name, source.emoji, source.allowedTypes))
        val target = collections.get(result.id)
        val pinIds = pins.copyAll(sourceId, target.id, userId)
        fun pin(id: String) = support.getPin(target.id, pinIds.getValue(id))
        stacks.findAllByCollectionIdOrderByLayer(sourceId).forEach { old ->
            val stack = PinStackEntity(
                id = "stack-${ids.newId()}", collection = target, gridX = old.gridX, gridY = old.gridY,
                heightClips = old.heightClips, layer = old.layer, expanded = old.expanded,
            )
            stack.children.addAll(old.children.map { child ->
                PinStackChildEntity(
                    stack = stack, pin = pin(child.pin!!.id), position = child.position,
                    originalX = child.originalX, originalY = child.originalY, originalLayer = child.originalLayer,
                )
            })
            stacks.save(stack)
        }
        connectors.findAllByCollectionId(sourceId).forEach { old ->
            connectors.save(BoardConnectorEntity(
                id = "connector-${ids.newId()}", collection = target,
                sourcePin = pin(old.sourcePin!!.id), targetPin = pin(old.targetPin!!.id), colorVariant = old.colorVariant,
            ))
        }
        zones.findAllByCollectionId(sourceId).forEach { old ->
            zones.save(SoftZoneEntity(
                id = "zone-${ids.newId()}", collection = target, gridX = old.gridX, gridY = old.gridY,
                widthClips = old.widthClips, heightClips = old.heightClips, colorVariant = old.colorVariant, label = old.label,
            ))
        }
        labels.findAllByCollectionId(sourceId).forEach { old ->
            labels.save(FloatingLabelEntity(
                id = "label-${ids.newId()}", collection = target, gridX = old.gridX, gridY = old.gridY,
                widthClips = old.widthClips, text = old.text, layer = old.layer,
            ))
        }
        stickers.findAllByCollectionIdOrderByLayer(sourceId).forEach { old ->
            stickers.save(StickerEntity(
                id = "sticker-${ids.newId()}", collection = target, positionX = old.positionX, positionY = old.positionY,
                widthClips = old.widthClips, heightClips = old.heightClips, rotation = old.rotation,
                layer = old.layer, motif = old.motif, colorVariant = old.colorVariant,
            ))
        }
        return collections.detail(target.id, userId)
    }
}
