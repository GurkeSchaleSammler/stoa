package com.stoasis.backend.domains.pin.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.api.AddCommentRequest
import com.stoasis.backend.domains.pin.api.CreatePinRequest
import com.stoasis.backend.domains.pin.api.LinkPinData
import com.stoasis.backend.domains.pin.api.NotePinData
import com.stoasis.backend.domains.pin.api.PhotoPinData
import com.stoasis.backend.domains.pin.api.PinCommentDto
import com.stoasis.backend.domains.pin.api.PinData
import com.stoasis.backend.domains.pin.api.PinDto
import com.stoasis.backend.domains.pin.api.UpdatePinRequest
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
) {
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
        collection.updatedAt = Instant.now()
        return toDto(pin)
    }

    @Transactional
    fun delete(collectionId: String, pinId: String, userId: String) {
        val collection = collections.get(collectionId)
        collections.requireEdit(collection, userId)
        pins.delete(get(collectionId, pinId))
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
