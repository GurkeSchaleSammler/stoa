package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import java.time.Instant

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
