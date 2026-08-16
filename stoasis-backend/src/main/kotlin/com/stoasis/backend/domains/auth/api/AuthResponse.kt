package com.stoasis.backend.domains.auth.api

import java.time.Instant

data class AuthResponse(val user: UserDto, val expiresAt: Instant)
