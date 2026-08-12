package com.stoasis.backend.domains.membership.api

import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility

data class MemberDto(
    val userId: String,
    val role: Role,
    val name: String,
    val email: String,
    val avatarUrl: String?,
)

data class UpdateRoleRequest(val role: Role)
data class UpdateInviteRequest(val visibility: Visibility)
data class InviteInfo(
    val collectionId: String,
    val token: String,
    val url: String,
    val visibility: Visibility,
    val collectionName: String,
    val alreadyMember: Boolean = false,
)
