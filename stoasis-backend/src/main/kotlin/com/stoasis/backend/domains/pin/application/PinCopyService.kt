package com.stoasis.backend.domains.pin.application

import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.pin.api.PinDto
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Copies persisted content, never trusting clipboard data or copying discussion/authorship. */
@Service
class PinCopyService(
    private val pins: PinRepository,
    private val collections: CollectionService,
    private val plans: PlanService,
    private val pinService: PinService,
    private val ids: IdGenerator,
) {
    @Transactional
    fun copy(sourceId: String, pinId: String, targetId: String, userId: String): PinDto {
        // Stable ordering also covers simultaneous A→B and B→A copies.
        val boards = listOf(sourceId, targetId).distinct().sorted().associateWith(collections::lock)
        val source = boards.getValue(sourceId)
        if (collections.roleOf(source, userId) == null) unavailable()
        val target = boards.getValue(targetId)
        collections.requireEdit(target, userId)
        val original = pins.findDetailed(sourceId, pinId) ?: unavailable()
        if (original.type !in target.allowedTypes) {
            throw ApiException(HttpStatus.CONFLICT, "Dieser Pin-Typ ist im Zielboard nicht erlaubt.")
        }
        val copy = clone(original, targetId, userId)
        val position = pinService.freeCopyPosition(targetId, copy.heightClips)
        copy.gridX = position.first
        copy.gridY = position.second
        copy.layer = (pins.findAllByCollectionIdOrderBySortOrder(targetId).maxOfOrNull { it.layer } ?: 0) + 1
        collections.touch(targetId, userId)
        return pinService.toDto(pins.saveAndFlush(copy))
    }

    /** Application port for copying into a newly created private board in the caller's transaction. */
    @Transactional
    fun copyAll(sourceId: String, targetId: String, userId: String): Map<String, String> {
        val source = collections.lock(sourceId)
        if (collections.roleOf(source, userId) == null || source.isSystem) unavailable()
        val target = collections.lock(targetId)
        collections.requireEdit(target, userId)
        if (pins.countByCollectionId(targetId) != 0L) {
            throw ApiException(HttpStatus.CONFLICT, "Das Zielboard muss leer sein.")
        }
        val originals = pins.findAllByCollectionIdOrderBySortOrder(sourceId)
        if (originals.size > 1000) throw ApiException(HttpStatus.CONFLICT, "Zum Duplizieren sind maximal 1000 Kacheln erlaubt.")
        return originals.associate { original ->
            val copy = clone(original, targetId, userId)
            original.id to pins.saveAndFlush(copy).id
        }
    }

    private fun clone(original: PinEntity, targetId: String, userId: String): PinEntity {
        plans.requirePinCapacity(userId, original.type)
        // Referenced upload bytes remain shared; deleting a pin only discards an unreferenced upload.
        return PinEntity(
            id = "pin-${ids.newId()}", collection = collections.get(targetId),
            createdBy = plans.lock(userId), type = original.type,
            sortOrder = pins.countByCollectionId(targetId).toInt() + 1,
            gridX = original.gridX, gridY = original.gridY, heightClips = original.heightClips,
            layer = original.layer, color = original.color, url = original.url, title = original.title,
            description = original.description, imageUrl = original.imageUrl, siteName = original.siteName,
            readingTimeMin = original.readingTimeMin, parseStatus = original.parseStatus,
            content = original.content, noteColor = original.noteColor, fileKey = original.fileKey,
            caption = original.caption, imageWidth = original.imageWidth, imageHeight = original.imageHeight,
            tags = original.tags.toMutableSet(),
        ).also {
            if (original.type == com.stoasis.backend.domains.collection.model.PinType.skill) {
                throw ApiException(HttpStatus.CONFLICT, "Skill-Kacheln gehören zum Profil und werden nicht kopiert.")
            }
        }
    }

    private fun unavailable(): Nothing = throw ApiException(HttpStatus.NOT_FOUND, "Kachel nicht verfügbar.")
}
