package com.stoasis.backend.domains.pin.api

import com.stoasis.backend.domains.collection.model.PinType
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import tools.jackson.databind.JsonNode

sealed interface PinData
data class LinkPinData(
    val url: String,
    val title: String,
    val description: String?,
    val imageUrl: String?,
    val siteName: String?,
    val readingTimeMin: Int?,
    val parseStatus: String,
) : PinData

data class NotePinData(val content: String, val color: String) : PinData
data class PhotoPinData(
    val fileKey: String,
    val caption: String?,
    val width: Int,
    val height: Int,
    val imageUrl: String?,
) : PinData

data class PinCommentDto(
    val authorId: String,
    val authorName: String,
    val body: String,
    val at: Instant,
)

data class PinDto(
    val id: String,
    val collectionId: String,
    val createdBy: String,
    val createdByName: String,
    val sortOrder: Int,
    val tags: Set<String>,
    val comments: List<PinCommentDto>,
    val createdAt: Instant,
    val type: PinType,
    val data: PinData,
)

data class CreatePinRequest(val type: PinType, val data: JsonNode, val tags: Set<String> = emptySet())
data class UpdatePinRequest(val data: JsonNode? = null, val tags: Set<String>? = null, val sortOrder: Int? = null)
data class AddCommentRequest(@field:NotBlank(message = "Kommentar darf nicht leer sein.") val body: String)
