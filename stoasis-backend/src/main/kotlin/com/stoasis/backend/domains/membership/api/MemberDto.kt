package com.stoasis.backend.domains.membership.api

import com.stoasis.backend.domains.collection.model.Role

data class MemberDto(
    val userId: String,
    val role: Role,
    val name: String,
    val email: String,
    val avatarUrl: String?,
)
