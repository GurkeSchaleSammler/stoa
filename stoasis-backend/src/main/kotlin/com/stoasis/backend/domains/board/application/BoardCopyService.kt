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
    private val experiences: BoardExperienceRepository,
    private val policy: BoardFeaturePolicy,
) {
    @Transactional
    fun duplicate(sourceId: String, userId: String, name: String): com.stoasis.backend.domains.collection.api.CollectionDetail {
        val source = collections.lock(sourceId)
        if (collections.roleOf(source, userId) == null || source.isSystem) {
            throw ApiException(HttpStatus.NOT_FOUND, "Board nicht verfügbar.")
        }
        val result = collections.create(userId, CreateCollectionRequest(name, source.emoji, source.allowedTypes))
        val target = collections.get(result.id)
        val sourcePaths = experiences.paths(sourceId)
        val sourceConnectors = connectors.findAllByCollectionId(sourceId)
        if (!policy.premium(target)) {
            if (sourcePaths.size > 7) policy.requireCapacity(target, 7, 7, "board.presentation_path_limit")
            if (sourceConnectors.count { it.label.isNotEmpty() } > 10) policy.requireCapacity(target, 10, 10, "board.connector_label_limit")
        }
        val pinIds = pins.copyAll(sourceId, target.id, userId)
        stacks.findAllByCollectionIdOrderByLayer(sourceId).forEach { old ->
            val copiedChildren = old.children.mapNotNull { child ->
                pinIds[child.pin!!.id]?.let { copiedId ->
                    PinStackChildEntity(
                        pin = support.getPin(target.id, copiedId), position = child.position,
                        originalX = child.originalX, originalY = child.originalY, originalLayer = child.originalLayer,
                    )
                }
            }
            if (copiedChildren.size < 2) return@forEach
            val stack = PinStackEntity(
                id = "stack-${ids.newId()}", collection = target, gridX = old.gridX, gridY = old.gridY,
                heightClips = old.heightClips, layer = old.layer, expanded = old.expanded,
            )
            copiedChildren.forEach { it.stack = stack }
            stack.children.addAll(copiedChildren)
            stacks.save(stack)
        }
        sourceConnectors.forEach { old ->
            val sourcePinId = pinIds[old.sourcePin!!.id] ?: return@forEach
            val targetPinId = pinIds[old.targetPin!!.id] ?: return@forEach
            connectors.save(BoardConnectorEntity(
                id = "connector-${ids.newId()}", collection = target,
                sourcePin = support.getPin(target.id, sourcePinId),
                targetPin = support.getPin(target.id, targetPinId), colorVariant = old.colorVariant, label = old.label,
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
        // Flush copied JPA pins before inserting JDBC rows with foreign keys.
        connectors.flush()
        experiences.dates(sourceId).forEach { old ->
            pinIds[old.pinId]?.let { experiences.saveDate(target.id, it, com.stoasis.backend.domains.board.api.SavePinDateRequest(old.startDate, old.endDate)) }
        }
        sourcePaths.forEach { old ->
            val steps = old.pinIds.mapNotNull { pinIds[it] }
            experiences.savePath(target.id, com.stoasis.backend.domains.board.api.PresentationPathDto("path-${ids.newId()}", old.name, steps), true)
        }
        return collections.detail(target.id, userId)
    }
}
