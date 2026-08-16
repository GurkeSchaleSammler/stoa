package com.stoasis.backend.domains.pin.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.board.data.PinStackChildRepository
import com.stoasis.backend.domains.board.data.PinStackRepository
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.api.AddCommentRequest
import com.stoasis.backend.domains.pin.api.CreatePinRequest
import com.stoasis.backend.domains.pin.api.GridBlockDto
import com.stoasis.backend.domains.pin.api.LinkPinData
import com.stoasis.backend.domains.pin.api.NotePinData
import com.stoasis.backend.domains.pin.api.PhotoPinData
import com.stoasis.backend.domains.pin.api.PinCommentDto
import com.stoasis.backend.domains.pin.api.PinData
import com.stoasis.backend.domains.pin.api.PinDto
import com.stoasis.backend.domains.pin.api.UpdatePinRequest
import com.stoasis.backend.domains.pin.api.UpdateGridBlockRequest
import com.stoasis.backend.domains.pin.data.PinCommentEntity
import com.stoasis.backend.domains.pin.data.PinCommentRepository
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.JsonNode

@Service
class PinService(
    private val pins: PinRepository,
    private val comments: PinCommentRepository,
    private val collections: CollectionService,
    private val users: UserRepository,
    private val stacks: PinStackRepository,
    private val stackChildren: PinStackChildRepository,
) {
    companion object {
        const val CARD_WIDTH_CLIPS = 16
        const val BOARD_WIDTH_CLIPS = 160
        const val BOARD_HEIGHT_CLIPS = 240
        private const val AUTO_LAYOUT_GAP_CLIPS = 2
    }

    @Transactional(readOnly = true)
    fun list(collectionId: String, userId: String): List<PinDto> {
        val collection = collections.get(collectionId)
        collections.requireView(collection, userId)
        return pins.findAllByCollectionIdOrderBySortOrder(collectionId).map(::toDto)
    }

    @Transactional
    fun create(collectionId: String, userId: String, request: CreatePinRequest): PinDto {
        val collection = collections.get(collectionId)
        collections.requireEdit(collection, userId)
        if (request.type !in collection.allowedTypes) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Dieser Pin-Typ ist nicht erlaubt.")
        }
        val pin = PinEntity(
            id = "pin-${UUID.randomUUID().toString().take(8)}",
            collection = collection,
            type = request.type,
            createdBy = users.getReferenceById(userId),
            sortOrder = pins.countByCollectionId(collectionId).toInt() + 1,
            tags = request.tags.map { it.trim().lowercase() }.filter { it.isNotBlank() }.toMutableSet(),
        )
        applyData(pin, request.data)
        val existing = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
        pin.heightClips = estimatedHeight(pin)
        val position = findFreePosition(pin.heightClips, occupiedRects(collectionId, existing))
        pin.gridX = position.first
        pin.gridY = position.second
        pin.layer = (existing.maxOfOrNull(PinEntity::layer) ?: 0) + 1
        collection.updatedAt = Instant.now()
        return toDto(pins.save(pin))
    }

    @Transactional
    fun update(collectionId: String, pinId: String, userId: String, request: UpdatePinRequest): PinDto {
        val collection = collections.get(collectionId)
        collections.requireEdit(collection, userId)
        val pin = get(collectionId, pinId)
        request.data?.let { applyData(pin, it) }
        request.tags?.let {
            pin.tags.clear()
            pin.tags.addAll(it.map(String::trim).map(String::lowercase).filter(String::isNotBlank))
        }
        request.sortOrder?.let { pin.sortOrder = it }
        request.grid?.let { applyGrid(collectionId, pin, it, pins.findAllByCollectionIdOrderBySortOrder(collectionId)) }
        collection.updatedAt = Instant.now()
        return toDto(pin)
    }

    @Transactional
    fun delete(collectionId: String, pinId: String, userId: String) {
        val collection = collections.get(collectionId)
        collections.requireEdit(collection, userId)
        val pin = get(collectionId, pinId)
        stacks.findByChildPinId(pinId)?.let { stack ->
            stack.children.removeIf { it.pin?.id == pinId }
            if (stack.children.size == 1) {
                stack.children.single().pin?.let { remaining ->
                    remaining.gridX = stack.gridX
                    remaining.gridY = stack.gridY
                    remaining.layer = stack.layer
                }
                stack.children.clear()
                stacks.delete(stack)
            }
        }
        pins.delete(pin)
        collection.updatedAt = Instant.now()
    }

    @Transactional
    fun addComment(collectionId: String, pinId: String, userId: String, request: AddCommentRequest): PinCommentDto {
        val collection = collections.get(collectionId)
        collections.requireView(collection, userId)
        val comment = comments.save(
            PinCommentEntity(
                pin = get(collectionId, pinId),
                author = users.getReferenceById(userId),
                body = request.body.trim(),
            ),
        )
        return toDto(comment)
    }

    fun toDto(pin: PinEntity): PinDto {
        val collectionId = pin.collection?.id.orEmpty()
        val data: PinData = when (pin.type) {
            PinType.link -> LinkPinData(
                url = pin.url.orEmpty(),
                title = pin.title.orEmpty(),
                description = pin.description,
                imageUrl = pin.imageUrl,
                siteName = pin.siteName,
                readingTimeMin = pin.readingTimeMin,
                parseStatus = pin.parseStatus ?: "ok",
            )
            PinType.note -> NotePinData(pin.content.orEmpty(), pin.noteColor ?: "yellow")
            PinType.photo -> PhotoPinData(
                fileKey = pin.fileKey.orEmpty(),
                caption = pin.caption,
                width = pin.imageWidth ?: 0,
                height = pin.imageHeight ?: 0,
                imageUrl = pin.imageUrl ?: pin.fileKey?.let { "/api/uploads/$it" },
            )
        }
        return PinDto(
            id = pin.id,
            collectionId = collectionId,
            createdBy = pin.createdBy?.id.orEmpty(),
            createdByName = pin.createdBy?.name ?: "Unbekannt",
            sortOrder = pin.sortOrder,
            tags = pin.tags,
            comments = pin.comments.map(::toDto),
            createdAt = pin.createdAt,
            type = pin.type,
            data = data,
            grid = GridBlockDto(
                id = pin.id,
                x = pin.gridX,
                y = pin.gridY,
                heightClips = pin.heightClips,
                layer = pin.layer,
                contentType = pin.type,
            ),
        )
    }

    private fun toDto(comment: PinCommentEntity) = PinCommentDto(
        authorId = comment.author?.id.orEmpty(),
        authorName = comment.author?.name ?: "Unbekannt",
        body = comment.body,
        at = comment.createdAt,
    )

    private fun get(collectionId: String, pinId: String) = pins.findDetailed(collectionId, pinId)
        ?: throw ApiException(HttpStatus.NOT_FOUND, "Pin nicht gefunden.")

    private fun applyGrid(
        collectionId: String,
        pin: PinEntity,
        grid: UpdateGridBlockRequest,
        collectionPins: List<PinEntity>,
    ) {
        if (stackChildren.existsByPinId(pin.id)) {
            throw ApiException(HttpStatus.CONFLICT, "Karten innerhalb eines Stacks werden über den Stack bewegt.")
        }
        if (grid.heightClips < 1 || grid.heightClips > BOARD_HEIGHT_CLIPS) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Kartenhöhe.")
        }
        if (grid.x !in 0..(BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS) ||
            grid.y !in 0..(BOARD_HEIGHT_CLIPS - grid.heightClips)
        ) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Die Karte liegt ausserhalb des Boards.")
        }
        if (grid.layer < 0) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Kartenebene.")
        }

        val candidate = GridRect(grid.x, grid.y, CARD_WIDTH_CLIPS, grid.heightClips)
        val stackedIds = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .flatMap { it.children }
            .mapNotNull { it.pin?.id }
            .toSet()
        val invalidPinOverlap = collectionPins
            .asSequence()
            .filter { it.id != pin.id && it.id !in stackedIds }
            .map { GridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        val invalidStackOverlap = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .asSequence()
            .map { GridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        if (invalidPinOverlap || invalidStackOverlap) {
            throw ApiException(HttpStatus.CONFLICT, "Karten dürfen sich höchstens zur Hälfte überlagern.")
        }

        pin.gridX = grid.x
        pin.gridY = grid.y
        pin.heightClips = grid.heightClips
        pin.layer = grid.layer
    }

    private fun estimatedHeight(pin: PinEntity): Int = when (pin.type) {
        PinType.link -> 18
        PinType.note -> (12 + (pin.content.orEmpty().length / 38)).coerceIn(12, 28)
        PinType.photo -> {
            val ratio = if ((pin.imageWidth ?: 0) > 0) {
                (pin.imageHeight ?: 0).toDouble() / (pin.imageWidth ?: 1)
            } else 0.7
            (8 + (CARD_WIDTH_CLIPS * ratio).toInt()).coerceIn(12, 30)
        }
    }

    private fun occupiedRects(collectionId: String, existing: List<PinEntity>): List<GridRect> {
        val allStacks = stacks.findAllByCollectionIdOrderByLayer(collectionId)
        val stackedIds = allStacks.flatMap { it.children }.mapNotNull { it.pin?.id }.toSet()
        return existing
            .filter { it.id !in stackedIds }
            .map { GridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) } +
            allStacks.map { GridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
    }

    private fun findFreePosition(heightClips: Int, occupied: List<GridRect>): Pair<Int, Int> {
        for (y in 0..(BOARD_HEIGHT_CLIPS - heightClips) step AUTO_LAYOUT_GAP_CLIPS) {
            for (x in 0..(BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS) step (CARD_WIDTH_CLIPS + AUTO_LAYOUT_GAP_CLIPS)) {
                val candidate = GridRect(x, y, CARD_WIDTH_CLIPS, heightClips)
                if (occupied.none { intersectionArea(candidate, it) > 0 }) return x to y
            }
        }
        throw ApiException(HttpStatus.CONFLICT, "Auf diesem Board ist kein freier Platz mehr verfügbar.")
    }

    private data class GridRect(val x: Int, val y: Int, val width: Int, val height: Int)

    private fun overlapAllowed(a: GridRect, b: GridRect): Boolean {
        val overlapArea = intersectionArea(a, b)
        val smallerArea = minOf(a.width * a.height, b.width * b.height)
        return overlapArea * 2 <= smallerArea
    }

    private fun intersectionArea(a: GridRect, b: GridRect): Int {
        val width = (minOf(a.x + a.width, b.x + b.width) - maxOf(a.x, b.x)).coerceAtLeast(0)
        val height = (minOf(a.y + a.height, b.y + b.height) - maxOf(a.y, b.y)).coerceAtLeast(0)
        return width * height
    }

    private fun applyData(pin: PinEntity, data: JsonNode) {
        fun text(name: String): String? = data.get(name)?.takeUnless { it.isNull }?.asString()
        fun number(name: String): Int? = data.get(name)?.takeUnless { it.isNull }?.asInt()
        when (pin.type) {
            PinType.link -> {
                text("url")?.let { pin.url = it }
                text("title")?.let { pin.title = it }
                if (data.has("description")) pin.description = text("description")
                if (data.has("imageUrl")) pin.imageUrl = text("imageUrl")
                text("siteName")?.let { pin.siteName = it }
                number("readingTimeMin")?.let { pin.readingTimeMin = it }
                pin.parseStatus = text("parseStatus") ?: pin.parseStatus ?: "ok"
                if (pin.url.isNullOrBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "URL ist erforderlich.")
                if (pin.title.isNullOrBlank()) pin.title = pin.url
            }
            PinType.note -> {
                text("content")?.let { pin.content = it }
                text("color")?.let { pin.noteColor = it }
                if (pin.content.isNullOrBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "Notiz ist erforderlich.")
            }
            PinType.photo -> {
                text("fileKey")?.let { pin.fileKey = it }
                if (data.has("caption")) pin.caption = text("caption")
                number("width")?.let { pin.imageWidth = it }
                number("height")?.let { pin.imageHeight = it }
                if (data.has("imageUrl")) pin.imageUrl = text("imageUrl")
                if (pin.fileKey.isNullOrBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "Foto fehlt.")
            }
        }
    }
}
