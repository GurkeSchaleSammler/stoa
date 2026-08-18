package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
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
    val boardKind: BoardKind?,
    val isSystem: Boolean,
)
