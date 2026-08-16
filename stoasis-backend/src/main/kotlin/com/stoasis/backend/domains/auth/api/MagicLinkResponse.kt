package com.stoasis.backend.domains.auth.api

import com.stoasis.backend.domains.auth.data.UserEntity

data class MagicLinkResponse(val message: String, val expiresInSeconds: Long)

fun UserEntity.toDto() = UserDto(id, email, name, avatarUrl, plan, createdAt)
