package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.CreateFloatingLabelRequest
import com.stoasis.backend.domains.board.api.CreateSoftZoneRequest
import com.stoasis.backend.domains.board.api.CreateStickerRequest
import com.stoasis.backend.domains.board.api.FloatingLabelDto
import com.stoasis.backend.domains.board.api.SoftZoneDto
import com.stoasis.backend.domains.board.api.StickerElementDto
import com.stoasis.backend.domains.board.api.UpdateFloatingLabelRequest
import com.stoasis.backend.domains.board.api.UpdateSoftZoneRequest
import com.stoasis.backend.domains.board.api.UpdateStickerRequest
import com.stoasis.backend.domains.board.data.FloatingLabelEntity
import com.stoasis.backend.domains.board.data.FloatingLabelRepository
import com.stoasis.backend.domains.board.data.SoftZoneEntity
import com.stoasis.backend.domains.board.data.SoftZoneRepository
import com.stoasis.backend.domains.board.data.StickerEntity
import com.stoasis.backend.domains.board.data.StickerRepository
import com.stoasis.backend.domains.board.utils.cleanOptionalBoardText
import com.stoasis.backend.domains.board.utils.requiredBoardText
import com.stoasis.backend.domains.board.utils.requireLabelBounds
import com.stoasis.backend.domains.board.utils.requireStickerGeometry
import com.stoasis.backend.domains.board.utils.requireZoneBounds
import com.stoasis.backend.domains.board.utils.toDto
import com.stoasis.backend.domains.board.utils.touchCollection
import com.stoasis.backend.domains.board.utils.validBoardColor
import com.stoasis.backend.domains.board.utils.validStickerMotif
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BoardDecorationService(
    private val support: BoardElementSupport,
    private val zones: SoftZoneRepository,
    private val labels: FloatingLabelRepository,
    private val stickers: StickerRepository,
    private val idGenerator: IdGenerator,
) {
    @Transactional
    fun createZone(collectionId: String, userId: String, request: CreateSoftZoneRequest): SoftZoneDto {
        val collection = support.editableCollection(collectionId, userId)
        requireZoneBounds(request.x, request.y, request.widthClips, request.heightClips)
        val zone = zones.save(
            SoftZoneEntity(
                id = "zone-${idGenerator.newId()}",
                collection = collection,
                gridX = request.x,
                gridY = request.y,
                widthClips = request.widthClips,
                heightClips = request.heightClips,
                colorVariant = validBoardColor(request.colorVariant),
                label = cleanOptionalBoardText(request.label, 80),
            ),
        )
        touchCollection(collection)
        return zone.toDto()
    }

    @Transactional
    fun updateZone(
        collectionId: String,
        zoneId: String,
        userId: String,
        request: UpdateSoftZoneRequest,
    ): SoftZoneDto {
        val collection = support.editableCollection(collectionId, userId)
        val zone = zones.findByIdAndCollectionId(zoneId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Zone nicht gefunden.")
        val x = request.x ?: zone.gridX
        val y = request.y ?: zone.gridY
        val width = request.widthClips ?: zone.widthClips
        val height = request.heightClips ?: zone.heightClips
        requireZoneBounds(x, y, width, height)
        zone.gridX = x
        zone.gridY = y
        zone.widthClips = width
        zone.heightClips = height
        request.colorVariant?.let { zone.colorVariant = validBoardColor(it) }
        request.label?.let { zone.label = cleanOptionalBoardText(it, 80) }
        touchCollection(collection)
        return zone.toDto()
    }

    @Transactional
    fun deleteZone(collectionId: String, zoneId: String, userId: String) {
        val collection = support.editableCollection(collectionId, userId)
        zones.delete(
            zones.findByIdAndCollectionId(zoneId, collectionId)
                ?: throw ApiException(HttpStatus.NOT_FOUND, "Zone nicht gefunden."),
        )
        touchCollection(collection)
    }

    @Transactional
    fun createLabel(
        collectionId: String,
        userId: String,
        request: CreateFloatingLabelRequest,
    ): FloatingLabelDto {
        val collection = support.editableCollection(collectionId, userId)
        requireLabelBounds(request.x, request.y, request.widthClips)
        val label = labels.save(
            FloatingLabelEntity(
                id = "label-${idGenerator.newId()}",
                collection = collection,
                gridX = request.x,
                gridY = request.y,
                widthClips = request.widthClips,
                text = requiredBoardText(request.text, 120),
                layer = request.layer.coerceAtLeast(0),
            ),
        )
        touchCollection(collection)
        return label.toDto()
    }

    @Transactional
    fun updateLabel(
        collectionId: String,
        labelId: String,
        userId: String,
        request: UpdateFloatingLabelRequest,
    ): FloatingLabelDto {
        val collection = support.editableCollection(collectionId, userId)
        val label = labels.findByIdAndCollectionId(labelId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Annotation nicht gefunden.")
        val x = request.x ?: label.gridX
        val y = request.y ?: label.gridY
        val width = request.widthClips ?: label.widthClips
        requireLabelBounds(x, y, width)
        label.gridX = x
        label.gridY = y
        label.widthClips = width
        request.text?.let { label.text = requiredBoardText(it, 120) }
        request.layer?.let { label.layer = it.coerceAtLeast(0) }
        touchCollection(collection)
        return label.toDto()
    }

    @Transactional
    fun deleteLabel(collectionId: String, labelId: String, userId: String) {
        val collection = support.editableCollection(collectionId, userId)
        labels.delete(
            labels.findByIdAndCollectionId(labelId, collectionId)
                ?: throw ApiException(HttpStatus.NOT_FOUND, "Annotation nicht gefunden."),
        )
        touchCollection(collection)
    }

    @Transactional
    fun createSticker(
        collectionId: String,
        userId: String,
        request: CreateStickerRequest,
    ): StickerElementDto {
        val collection = support.editableCollection(collectionId, userId)
        requireStickerGeometry(
            request.x,
            request.y,
            request.widthClips,
            request.heightClips,
            request.rotation,
        )
        val sticker = stickers.save(
            StickerEntity(
                id = "sticker-${idGenerator.newId()}",
                collection = collection,
                positionX = request.x,
                positionY = request.y,
                widthClips = request.widthClips,
                heightClips = request.heightClips,
                rotation = request.rotation,
                layer = request.layer.coerceAtLeast(0),
                motif = validStickerMotif(request.motif),
                colorVariant = validBoardColor(request.colorVariant),
            ),
        )
        touchCollection(collection)
        return sticker.toDto()
    }

    @Transactional
    fun updateSticker(
        collectionId: String,
        stickerId: String,
        userId: String,
        request: UpdateStickerRequest,
    ): StickerElementDto {
        val collection = support.editableCollection(collectionId, userId)
        val sticker = stickers.findByIdAndCollectionId(stickerId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Sticker nicht gefunden.")
        val x = request.x ?: sticker.positionX
        val y = request.y ?: sticker.positionY
        val width = request.widthClips ?: sticker.widthClips
        val height = request.heightClips ?: sticker.heightClips
        val rotation = request.rotation ?: sticker.rotation
        requireStickerGeometry(x, y, width, height, rotation)
        sticker.positionX = x
        sticker.positionY = y
        sticker.widthClips = width
        sticker.heightClips = height
        sticker.rotation = rotation
        request.layer?.let { sticker.layer = it.coerceAtLeast(0) }
        request.motif?.let { sticker.motif = validStickerMotif(it) }
        request.colorVariant?.let { sticker.colorVariant = validBoardColor(it) }
        touchCollection(collection)
        return sticker.toDto()
    }

    @Transactional
    fun deleteSticker(collectionId: String, stickerId: String, userId: String) {
        val collection = support.editableCollection(collectionId, userId)
        stickers.delete(
            stickers.findByIdAndCollectionId(stickerId, collectionId)
                ?: throw ApiException(HttpStatus.NOT_FOUND, "Sticker nicht gefunden."),
        )
        touchCollection(collection)
    }
}
