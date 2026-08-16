package com.stoasis.backend.domains.auth.api

import java.time.Instant

data class UserDto(
    val id: String,
    val email: String,
    val name: String,
    val avatarUrl: String?,
    val plan: String,
    val createdAt: Instant,
)
