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
import com.stoasis.backend.domains.pin.api.SkillPinData
import com.stoasis.backend.domains.pin.api.UpdatePinRequest
import com.stoasis.backend.domains.pin.api.UpdateGridBlockRequest
import com.stoasis.backend.domains.pin.data.PinCommentEntity
import com.stoasis.backend.domains.pin.data.PinCommentRepository
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.pin.model.PinGridRect
import com.stoasis.backend.domains.pin.utils.estimatedPinHeight
import com.stoasis.backend.domains.pin.utils.findFreePinPosition
import com.stoasis.backend.domains.pin.utils.pinOverlapAllowed
import com.stoasis.backend.domains.skill.data.SkillDataEntity
import com.stoasis.backend.domains.skill.data.SkillDataRepository
import com.stoasis.backend.domains.skill.model.SkillLevel
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
    private val skillData: SkillDataRepository,
) {
    companion object {
        const val CARD_WIDTH_CLIPS = 16
        const val BOARD_WIDTH_CLIPS = 160
        const val BOARD_HEIGHT_CLIPS = 240
    }

    @Transactional(readOnly = true)
    fun list(collectionId: String, userId: String): List<PinDto> {
        val collection = collections.get(collectionId)
        collections.requireView(collection, userId)
        return pins.findAllByCollectionIdOrderBySortOrder(collectionId).map(::toDto)
    }

    @Transactional(readOnly = true)
    fun listShared(collectionId: String, token: String?, viewerId: String?): List<PinDto> {
        val collection = collections.get(collectionId)
        collections.requireSharedView(collection, token, viewerId)
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
        if (request.type != PinType.skill) applyData(pin, request.data)
        val existing = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
        pin.heightClips = estimatedPinHeight(pin)
        val position = findFreePinPosition(pin.heightClips, occupiedRects(collectionId, existing))
        pin.gridX = position.first
        pin.gridY = position.second
        pin.layer = (existing.maxOfOrNull(PinEntity::layer) ?: 0) + 1
        collection.updatedAt = Instant.now()
        val saved = pins.save(pin)
        if (request.type == PinType.skill) applySkillData(saved.id, request.data)
        return toDto(saved)
    }

    @Transactional
    fun update(collectionId: String, pinId: String, userId: String, request: UpdatePinRequest): PinDto {
        val collection = collections.get(collectionId)
        collections.requireEdit(collection, userId)
        val pin = get(collectionId, pinId)
        request.data?.let {
            if (pin.type == PinType.skill) applySkillData(pin.id, it) else applyData(pin, it)
        }
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
            PinType.skill -> skillData.findById(pin.id).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Skill-Daten fehlen.")
            }.let { SkillPinData(it.skillName, it.level, it.yearsExperience?.toInt()) }
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

        val candidate = PinGridRect(grid.x, grid.y, CARD_WIDTH_CLIPS, grid.heightClips)
        val stackedIds = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .flatMap { it.children }
            .mapNotNull { it.pin?.id }
            .toSet()
        val invalidPinOverlap = collectionPins
            .asSequence()
            .filter { it.id != pin.id && it.id !in stackedIds }
            .map { PinGridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !pinOverlapAllowed(candidate, it) }
        val invalidStackOverlap = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .asSequence()
            .map { PinGridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !pinOverlapAllowed(candidate, it) }
        if (invalidPinOverlap || invalidStackOverlap) {
            throw ApiException(HttpStatus.CONFLICT, "Karten dürfen sich höchstens zur Hälfte überlagern.")
        }

        pin.gridX = grid.x
        pin.gridY = grid.y
        pin.heightClips = grid.heightClips
        pin.layer = grid.layer
    }

    private fun occupiedRects(collectionId: String, existing: List<PinEntity>): List<PinGridRect> {
        val allStacks = stacks.findAllByCollectionIdOrderByLayer(collectionId)
        val stackedIds = allStacks.flatMap { it.children }.mapNotNull { it.pin?.id }.toSet()
        return existing
            .filter { it.id !in stackedIds }
            .map { PinGridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) } +
            allStacks.map { PinGridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
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
            PinType.skill -> applySkillData(pin.id, data)
        }
    }

    private fun applySkillData(pinId: String, data: JsonNode) {
        fun text(name: String): String? = data.get(name)?.takeUnless { it.isNull }?.asString()?.trim()
        val entry = skillData.findById(pinId).orElse(SkillDataEntity(pinId = pinId))
        text("skillName")?.let { entry.skillName = it }
        text("level")?.let { value ->
            entry.level = runCatching { SkillLevel.valueOf(value.uppercase()) }.getOrElse {
                throw ApiException(HttpStatus.BAD_REQUEST, "Ungültiges Skill-Level.")
            }
        }
        if (data.has("yearsExperience")) {
            val years = data.get("yearsExperience")
                ?.takeUnless { it.isNull }
                ?.asInt()
            if (years != null && years !in 0..80) {
                throw ApiException(HttpStatus.BAD_REQUEST, "Berufserfahrung muss zwischen 0 und 80 Jahren liegen.")
            }
            entry.yearsExperience = years?.toShort()
        }
        if (entry.skillName.isBlank()) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Skill-Name ist erforderlich.")
        }
        if (entry.skillName.length > 120) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Skill-Name darf höchstens 120 Zeichen lang sein.")
        }
        if (entry.yearsExperience?.toInt()?.let { it !in 0..80 } == true) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Berufserfahrung muss zwischen 0 und 80 Jahren liegen.")
        }
        skillData.save(entry)
    }
}
