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
import com.stoasis.backend.domains.pin.api.PortalPinData
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
import com.stoasis.backend.shared.utils.normalizeNoteBackgroundColor
import com.stoasis.backend.shared.utils.normalizeUiColor
import com.stoasis.backend.shared.web.ApiException
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.domains.search.application.normalizeTags
import com.stoasis.backend.domains.upload.application.PhotoPinService
import com.stoasis.backend.domains.upload.application.UploadService
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.domains.world.application.WorldService
import java.time.Instant
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.JsonNode

/** Creates and edits pins while enforcing board permissions and account capacity. */
@Service
class PinService(
    private val pins: PinRepository,
    private val comments: PinCommentRepository,
    private val collections: CollectionService,
    private val users: UserRepository,
    private val stacks: PinStackRepository,
    private val stackChildren: PinStackChildRepository,
    private val skillData: SkillDataRepository,
    private val plans: PlanService,
    private val photos: PhotoPinService,
    private val uploads: UploadService,
    private val worlds: WorldService,
    private val idGenerator: IdGenerator,
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
        return pins.findAllByCollectionIdOrderBySortOrder(collectionId).map { pin ->
            val dto = toDto(pin)
            val data = dto.data
            if (token != null && data is PhotoPinData && data.imageUrl != null) {
                dto.copy(data = data.copy(imageUrl = "${data.imageUrl}?token=${java.net.URLEncoder.encode(token, Charsets.UTF_8)}"))
            } else dto
        }
    }

    /** Called only after another service has authorized a published World board. */
    @Transactional(readOnly = true)
    fun listAuthorized(collectionId: String): List<PinDto> =
        pins.findAllByCollectionIdOrderBySortOrder(collectionId).map(::toDto)

    @Transactional(readOnly = true)
    fun detail(collectionId: String, pinId: String, userId: String): PinDto {
        val collection = collections.get(collectionId)
        collections.requireView(collection, userId)
        return toDto(get(collectionId, pinId))
    }

    @Transactional
    fun create(collectionId: String, userId: String, request: CreatePinRequest): PinDto {
        val collection = collections.lock(collectionId)
        collections.requireEdit(collection, userId)
        if (request.type !in collection.allowedTypes) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Dieser Pin-Typ ist nicht erlaubt.")
        }
        plans.requirePinCapacity(userId, request.type)
        val pin = PinEntity(
            id = "pin-${idGenerator.newId()}",
            collection = collection,
            type = request.type,
            createdBy = users.getReferenceById(userId),
            sortOrder = pins.countByCollectionId(collectionId).toInt() + 1,
            color = cleanPinColor(request.color, userId),
            tags = normalizeTags(request.tags),
        )
        if (request.type != PinType.skill) applyData(pin, request.data, userId)
        val existing = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
        pin.heightClips = estimatedPinHeight(pin)
        pin.baseHeightClips = pin.heightClips
        val position = findFreePinPosition(pin.heightClips, occupiedRects(collectionId, existing))
        pin.gridX = position.first
        pin.gridY = position.second
        pin.layer = (existing.maxOfOrNull(PinEntity::layer) ?: 0) + 1
        collection.updatedAt = Instant.now()
        val saved = pins.save(pin)
        if (request.type == PinType.skill) applySkillData(saved.id, request.data)
        if (request.type == PinType.portal && request.data.get("createReturnPortal")?.asBoolean(false) == true) {
            createReturnPortal(saved, userId)
        }
        return toDto(saved)
    }

    @Transactional
    fun update(collectionId: String, pinId: String, userId: String, request: UpdatePinRequest): PinDto {
        val collection = collections.get(collectionId)
        collections.requireEdit(collection, userId)
        val pin = get(collectionId, pinId)
        val previousFile = pin.fileKey
        request.data?.let {
            if (pin.type == PinType.skill) applySkillData(pin.id, it) else applyData(pin, it, userId)
        }
        if (previousFile != null && previousFile != pin.fileKey) uploads.discardUnused(previousFile)
        request.color?.let { pin.color = cleanPinColor(it, userId, pin.color) }
        request.tags?.let {
            pin.tags.clear()
            pin.tags.addAll(normalizeTags(it))
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
                    remaining.gridX = stack.gridX.coerceAtMost(BOARD_WIDTH_CLIPS - remaining.widthClips)
                    remaining.gridY = stack.gridY
                    remaining.layer = stack.layer
                }
                stack.children.clear()
                stacks.delete(stack)
            }
        }
        pins.delete(pin)
        pin.fileKey?.let(uploads::discardUnused)
        collection.updatedAt = Instant.now()
    }

    @Transactional
    fun addComment(collectionId: String, pinId: String, userId: String, request: AddCommentRequest): PinCommentDto {
        val collection = collections.get(collectionId)
        if (collection.isSystem || collections.roleOf(collection, userId) == null) {
            throw ApiException(HttpStatus.FORBIDDEN, "Kommentare sind hier nicht erlaubt.")
        }
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
            PinType.note -> NotePinData(
                content = pin.content.orEmpty(),
                color = pin.noteColor ?: "white",
                title = pin.title,
            )
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
            PinType.portal -> PortalPinData(
                worldId = pin.portalWorld?.id,
                targetCollectionId = pin.portalTargetCollection?.id,
                targetName = pin.portalTargetCollection?.name,
                targetEmoji = pin.portalTargetCollection?.emoji,
                label = pin.portalLabel ?: pin.portalTargetCollection?.name ?: "Entferntes Board",
                emoji = pin.portalEmoji ?: pin.portalTargetCollection?.emoji ?: "↗",
                available = pin.portalWorld != null && pin.portalTargetCollection != null,
            )
        }
        return PinDto(
            id = pin.id,
            collectionId = collectionId,
            createdBy = pin.createdBy?.id.orEmpty(),
            createdByName = pin.createdBy?.name ?: "Unbekannt",
            createdByAvatarUrl = pin.createdBy?.avatarUrl,
            sortOrder = pin.sortOrder,
            tags = pin.tags,
            comments = pin.comments.map(::toDto),
            createdAt = pin.createdAt,
            color = pin.color,
            type = pin.type,
            data = data,
            grid = GridBlockDto(
                id = pin.id,
                x = pin.gridX,
                y = pin.gridY,
                heightClips = pin.heightClips,
                width = pin.widthClips,
                baseHeightClips = pin.baseHeightClips,
                manualSize = pin.manualSize,
                layer = pin.layer,
                contentType = pin.type,
            ),
        )
    }

    private fun toDto(comment: PinCommentEntity) = PinCommentDto(
        authorId = comment.author?.id.orEmpty(),
        authorName = comment.author?.name ?: "Unbekannt",
        authorAvatarUrl = comment.author?.avatarUrl,
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
        val width = grid.width ?: pin.widthClips
        val manualSize = grid.manualSize ?: pin.manualSize
        if (width !in CARD_WIDTH_CLIPS..(CARD_WIDTH_CLIPS * 2)) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Kartenbreite.")
        }
        if (pin.manualSize && grid.manualSize == false) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Eine manuelle Kartengrösse kann nicht automatisch überschrieben werden.")
        }
        if (width != CARD_WIDTH_CLIPS && !manualSize) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Eine veränderte Breite erfordert eine manuelle Kartengrösse.")
        }
        if (manualSize && grid.heightClips !in pin.baseHeightClips..minOf(BOARD_HEIGHT_CLIPS, pin.baseHeightClips * 2)) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Karten dürfen höchstens auf die doppelte Höhe vergrössert werden.")
        }
        if (grid.heightClips < 1 || grid.heightClips > BOARD_HEIGHT_CLIPS) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Kartenhöhe.")
        }
        if (grid.x !in 0..(BOARD_WIDTH_CLIPS - width) ||
            grid.y !in 0..(BOARD_HEIGHT_CLIPS - grid.heightClips)
        ) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Die Karte liegt ausserhalb des Boards.")
        }
        if (grid.layer < 0) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Kartenebene.")
        }

        val candidate = PinGridRect(grid.x, grid.y, width, grid.heightClips)
        val stackedIds = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .flatMap { it.children }
            .mapNotNull { it.pin?.id }
            .toSet()
        val invalidPinOverlap = collectionPins
            .asSequence()
            .filter { it.id != pin.id && it.id !in stackedIds }
            .map { PinGridRect(it.gridX, it.gridY, it.widthClips, it.heightClips) }
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
        pin.widthClips = width
        pin.manualSize = manualSize
        if (!manualSize) pin.baseHeightClips = grid.heightClips
        pin.heightClips = grid.heightClips
        pin.layer = grid.layer
    }

    fun freeCopyPosition(collectionId: String, height: Int, width: Int = CARD_WIDTH_CLIPS): Pair<Int, Int> =
        findFreePinPosition(height, occupiedRects(collectionId, pins.findAllByCollectionIdOrderBySortOrder(collectionId)), width)

    private fun occupiedRects(collectionId: String, existing: List<PinEntity>): List<PinGridRect> {
        val allStacks = stacks.findAllByCollectionIdOrderByLayer(collectionId)
        val stackedIds = allStacks.flatMap { it.children }.mapNotNull { it.pin?.id }.toSet()
        return existing
            .filter { it.id !in stackedIds }
            .map { PinGridRect(it.gridX, it.gridY, it.widthClips, it.heightClips) } +
            allStacks.map { PinGridRect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
    }

    private fun applyData(pin: PinEntity, data: JsonNode, userId: String) {
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
                if (data.has("title")) pin.title = text("title")?.trim()?.takeIf(String::isNotBlank)
                text("content")?.let { pin.content = it }
                text("color")?.let { pin.noteColor = cleanNoteBackgroundColor(it, userId, pin.noteColor) }
                if (pin.title.isNullOrBlank() && pin.content.isNullOrBlank()) {
                    throw ApiException(HttpStatus.BAD_REQUEST, "Notiz ist erforderlich.")
                }
            }
            PinType.photo -> photos.apply(pin, data, userId)
            PinType.portal -> {
                val sourceId = pin.collection?.id
                    ?: throw ApiException(HttpStatus.BAD_REQUEST, "Quellboard fehlt.")
                val worldId = text("worldId") ?: pin.portalWorld?.id
                    ?: throw ApiException(HttpStatus.BAD_REQUEST, "World ist erforderlich.")
                val targetId = text("targetCollectionId") ?: pin.portalTargetCollection?.id
                    ?: throw ApiException(HttpStatus.BAD_REQUEST, "Zielboard ist erforderlich.")
                val world = worlds.requirePortalMembership(worldId, sourceId, targetId, userId)
                val target = collections.get(targetId)
                collections.requireEdit(target, userId)
                if (PinType.portal !in target.allowedTypes) {
                    throw ApiException(HttpStatus.CONFLICT, "Portal-Pins sind im Zielboard nicht erlaubt.")
                }
                val label = (text("label") ?: pin.portalLabel ?: target.name).trim()
                val emoji = (text("emoji") ?: pin.portalEmoji ?: target.emoji).trim().ifBlank { "↗" }
                if (label.isBlank() || label.length > 180 || emoji.length > 32) {
                    throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Portal-Darstellung.")
                }
                pin.portalWorld = world
                pin.portalTargetCollection = target
                pin.portalLabel = label
                pin.portalEmoji = emoji
            }
            PinType.skill -> applySkillData(pin.id, data)
        }
    }

    private fun createReturnPortal(portal: PinEntity, userId: String) {
        val source = portal.collection ?: throw ApiException(HttpStatus.BAD_REQUEST, "Quellboard fehlt.")
        val target = portal.portalTargetCollection ?: throw ApiException(HttpStatus.BAD_REQUEST, "Zielboard fehlt.")
        val world = portal.portalWorld ?: throw ApiException(HttpStatus.BAD_REQUEST, "World fehlt.")
        worlds.requirePortalMembership(world.id, target.id, source.id, userId)
        collections.requireEdit(target, userId)
        if (PinType.portal !in target.allowedTypes) {
            throw ApiException(HttpStatus.CONFLICT, "Portal-Pins sind im Zielboard nicht erlaubt.")
        }
        val existing = pins.findAllByCollectionIdOrderBySortOrder(target.id)
        val backlink = PinEntity(
            id = "pin-${idGenerator.newId()}", collection = target, type = PinType.portal,
            createdBy = users.getReferenceById(userId), sortOrder = existing.size + 1,
            portalWorld = world, portalTargetCollection = source,
            portalLabel = source.name, portalEmoji = source.emoji,
        )
        backlink.heightClips = estimatedPinHeight(backlink)
        backlink.baseHeightClips = backlink.heightClips
        val position = findFreePinPosition(backlink.heightClips, occupiedRects(target.id, existing))
        backlink.gridX = position.first
        backlink.gridY = position.second
        backlink.layer = (existing.maxOfOrNull(PinEntity::layer) ?: 0) + 1
        target.updatedAt = Instant.now()
        pins.save(backlink)
    }

    private fun cleanPinColor(value: String?, userId: String, currentColor: String? = null): String? {
        val trimmed = value?.trim()
        if (trimmed.isNullOrBlank()) return null
        val normalized = normalizeUiColor(trimmed)
            ?: throw ApiException(HttpStatus.BAD_REQUEST, "Ungültiger Farbcode.")
        requireCustomColorAccess(normalized, currentColor, userId)
        return normalized
    }

    private fun cleanNoteBackgroundColor(value: String, userId: String, currentColor: String?): String {
        val normalized = normalizeNoteBackgroundColor(value)
            ?: throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Hintergrundfarbe.")
        requireCustomColorAccess(normalized, currentColor, userId)
        return normalized
    }

    private fun requireCustomColorAccess(color: String, currentColor: String?, userId: String) {
        if (!color.startsWith("#") || color.equals(currentColor, ignoreCase = true)) return
        val plan = users.getReferenceById(userId).plan.lowercase()
        if (plan != "premium") {
            throw ApiException(HttpStatus.FORBIDDEN, "Eigene Farben sind nur mit Pro verfügbar.")
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
