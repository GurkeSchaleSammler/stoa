package com.stoasis.backend.domains.search.api

import com.stoasis.backend.domains.pin.api.PinData
import com.stoasis.backend.domains.pin.api.PinDto

data class TagDto(val id: String, val name: String)
data class CreateTagRequest(val name: String)

data class SearchResultDto(
    val collectionId: String,
    val collectionName: String,
    val id: String,
    val createdBy: String,
    val createdByName: String,
    val sortOrder: Int,
    val tags: Set<String>,
    val comments: List<com.stoasis.backend.domains.pin.api.PinCommentDto>,
    val createdAt: java.time.Instant,
    val type: com.stoasis.backend.domains.collection.model.PinType,
    val data: PinData,
)

fun PinDto.toSearchResult(collectionName: String) = SearchResultDto(
    collectionId,
    collectionName,
    id,
    createdBy,
    createdByName,
    sortOrder,
    tags,
    comments,
    createdAt,
    type,
    data,
)
