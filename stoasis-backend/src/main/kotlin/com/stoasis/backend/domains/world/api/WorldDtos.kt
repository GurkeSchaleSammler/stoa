package com.stoasis.backend.domains.world.api

import com.stoasis.backend.domains.collection.api.PublicCollectionDto
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.pin.api.PinDto
import jakarta.validation.constraints.Size
import java.time.Instant

data class CreateWorldRequest(
    @field:Size(min = 1, max = 180) val name: String,
    @field:Size(max = 32) val emoji: String = "🌐",
    @field:Size(min = 1, max = 64) val startCollectionId: String,
)

data class UpdateWorldRequest(
    @field:Size(min = 1, max = 180) val name: String? = null,
    @field:Size(max = 32) val emoji: String? = null,
    @field:Size(min = 1, max = 64) val startCollectionId: String? = null,
    val visibility: Visibility? = null,
)

data class AddWorldBoardRequest(@field:Size(min = 1, max = 64) val collectionId: String)

data class WorldBoardDto(
    val id: String,
    val name: String,
    val emoji: String,
    val pinCount: Long,
    val isStart: Boolean,
    val backlinkCount: Int,
)

data class WorldPortalDto(
    val pinId: String,
    val sourceCollectionId: String,
    val targetCollectionId: String?,
    val label: String,
    val emoji: String,
)

data class WorldLimitsDto(
    val premium: Boolean,
    val worldCount: Long,
    val worldLimit: Int,
    val boardCount: Int,
    val boardLimit: Int,
)

data class WorldSummary(
    val id: String,
    val name: String,
    val emoji: String,
    val visibility: Visibility,
    val startCollectionId: String,
    val boardCount: Int,
    val updatedAt: Instant,
)

data class WorldDetail(
    val id: String,
    val name: String,
    val emoji: String,
    val visibility: Visibility,
    val ownerId: String,
    val startCollectionId: String,
    val boardCount: Int,
    val shareToken: String?,
    val boards: List<WorldBoardDto>,
    val portals: List<WorldPortalDto>,
    val limits: WorldLimitsDto,
    val updatedAt: Instant,
)

data class WorldBoardContentDto(val collection: PublicCollectionDto, val pins: List<PinDto>)
