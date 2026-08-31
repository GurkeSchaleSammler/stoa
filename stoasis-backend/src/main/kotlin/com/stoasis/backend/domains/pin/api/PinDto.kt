package com.stoasis.backend.domains.pin.api

import com.stoasis.backend.domains.collection.model.PinType
import java.time.Instant

data class PinDto(
    val id: String,
    val collectionId: String,
    val createdBy: String,
    val createdByName: String,
    val createdByAvatarUrl: String?,
    val sortOrder: Int,
    val tags: Set<String>,
    val comments: List<PinCommentDto>,
    val createdAt: Instant,
    val color: String?,
    val type: PinType,
    val data: PinData,
    val grid: GridBlockDto,
)
