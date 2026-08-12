package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import java.time.Instant

data class MemberSummary(val userId: String, val role: Role, val name: String)

open class CollectionSummary(
    val id: String,
    val name: String,
    val emoji: String,
    val allowedTypes: Set<PinType>,
    val visibility: Visibility,
    val pinCount: Long,
    val members: List<MemberSummary>,
    val updatedAt: Instant,
)

class CollectionDetail(
    id: String,
    name: String,
    emoji: String,
    allowedTypes: Set<PinType>,
    visibility: Visibility,
    pinCount: Long,
    members: List<MemberSummary>,
    updatedAt: Instant,
    val ownerId: String,
    val inviteToken: String?,
    val currentUserRole: Role?,
) : CollectionSummary(id, name, emoji, allowedTypes, visibility, pinCount, members, updatedAt)

data class CreateCollectionRequest(
    @field:NotBlank(message = "Name ist erforderlich.") val name: String,
    val emoji: String = "📌",
    @field:NotEmpty(message = "Mindestens ein Pin-Typ ist erforderlich.")
    val allowedTypes: Set<PinType>,
)

data class UpdateCollectionRequest(
    val name: String? = null,
    val emoji: String? = null,
    val allowedTypes: Set<PinType>? = null,
    val visibility: Visibility? = null,
)

data class CollectionIdResponse(val collectionId: String)
