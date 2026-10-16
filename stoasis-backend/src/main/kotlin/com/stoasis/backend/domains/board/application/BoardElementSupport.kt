package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.data.FloatingLabelEntity
import com.stoasis.backend.domains.board.data.FloatingLabelRepository
import com.stoasis.backend.domains.board.data.PinStackChildRepository
import com.stoasis.backend.domains.board.data.PinStackEntity
import com.stoasis.backend.domains.board.data.PinStackRepository
import com.stoasis.backend.domains.board.data.StickerEntity
import com.stoasis.backend.domains.board.data.StickerRepository
import com.stoasis.backend.domains.board.model.BoardRect
import com.stoasis.backend.domains.board.utils.overlapAllowed
import com.stoasis.backend.domains.board.utils.overlapError
import com.stoasis.backend.domains.board.utils.requireGridBounds
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.pin.application.PinService.Companion.CARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

@Component
class BoardElementSupport(
    private val collections: CollectionService,
    private val pins: PinRepository,
    private val stacks: PinStackRepository,
    private val stackChildren: PinStackChildRepository,
    private val labels: FloatingLabelRepository,
    private val stickers: StickerRepository,
) {
    fun editableCollection(collectionId: String, userId: String): CollectionEntity =
        collections.get(collectionId).also { collections.requireEdit(it, userId) }

    fun getPin(collectionId: String, pinId: String): PinEntity =
        pins.findDetailed(collectionId, pinId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Pin nicht gefunden.")

    fun requirePins(collectionId: String, pinIds: List<String>) {
        val ids = pinIds.distinct()
        // Chunking avoids database parameter limits without imposing a station quota.
        val count = ids.chunked(500).sumOf { pins.countByCollectionIdAndIdIn(collectionId, it) }
        if (count != ids.size.toLong()) throw ApiException(HttpStatus.NOT_FOUND, "Pin nicht gefunden.")
    }

    fun getStack(collectionId: String, stackId: String): PinStackEntity =
        stacks.findDetailed(collectionId, stackId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Stack nicht gefunden.")

    fun requireSolo(pinId: String) {
        if (stackChildren.existsByPinId(pinId)) {
            throw ApiException(HttpStatus.CONFLICT, "Die Karte gehört bereits zu einem Stack.")
        }
    }

    fun maxLayer(collectionId: String): Int = maxOf(
        pins.findAllByCollectionIdOrderBySortOrder(collectionId).maxOfOrNull(PinEntity::layer) ?: 0,
        stacks.findAllByCollectionIdOrderByLayer(collectionId).maxOfOrNull(PinStackEntity::layer) ?: 0,
        labels.findAllByCollectionId(collectionId).maxOfOrNull(FloatingLabelEntity::layer) ?: 0,
        stickers.findAllByCollectionIdOrderByLayer(collectionId).maxOfOrNull(StickerEntity::layer) ?: 0,
    )

    fun requireStackPositionAllowed(
        collectionId: String,
        stackId: String,
        x: Int,
        y: Int,
        height: Int,
    ) {
        requireGridBounds(x, y, height, CARD_WIDTH_CLIPS)
        val candidate = BoardRect(x, y, CARD_WIDTH_CLIPS, height)
        val stackedIds = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .flatMap { it.children }
            .mapNotNull { it.pin?.id }
            .toSet()
        val invalidPin = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
            .asSequence()
            .filter { it.id !in stackedIds }
            .map { BoardRect(it.gridX, it.gridY, it.widthClips, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        val invalidStack = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .asSequence()
            .filter { it.id != stackId }
            .map { BoardRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        if (invalidPin || invalidStack) overlapError()
    }

    fun requireNewStackPositionAllowed(
        collectionId: String,
        x: Int,
        y: Int,
        height: Int,
        childIds: Set<String>,
    ) {
        requireGridBounds(x, y, height, CARD_WIDTH_CLIPS)
        val candidate = BoardRect(x, y, CARD_WIDTH_CLIPS, height)
        val existingStacks = stacks.findAllByCollectionIdOrderByLayer(collectionId)
        val stackedIds = existingStacks.flatMap { it.children }.mapNotNull { it.pin?.id }.toSet()
        val invalidPin = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
            .asSequence()
            .filter { it.id !in childIds && it.id !in stackedIds }
            .map { BoardRect(it.gridX, it.gridY, it.widthClips, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        val invalidStack = existingStacks
            .asSequence()
            .map { BoardRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        if (invalidPin || invalidStack) overlapError()
    }

    fun requirePinPositionAllowed(
        collectionId: String,
        pinId: String,
        sourceStackId: String,
        x: Int,
        y: Int,
        height: Int,
    ) {
        val candidate = BoardRect(x, y, getPin(collectionId, pinId).widthClips, height)
        val allStacks = stacks.findAllByCollectionIdOrderByLayer(collectionId)
        val stackedIds = allStacks.flatMap { it.children }.mapNotNull { it.pin?.id }.toSet()
        val invalidPin = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
            .asSequence()
            .filter { it.id != pinId && it.id !in stackedIds }
            .map { BoardRect(it.gridX, it.gridY, it.widthClips, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        val invalidStack = allStacks
            .asSequence()
            .filter { it.id != sourceStackId }
            .map { BoardRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        if (invalidPin || invalidStack) overlapError()
    }
}
