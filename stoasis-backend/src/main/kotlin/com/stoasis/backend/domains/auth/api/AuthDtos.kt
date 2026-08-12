package com.stoasis.backend.domains.auth.api

import com.stoasis.backend.domains.auth.data.UserEntity
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class LoginRequest(
    @field:Email(message = "Ungültige E-Mail-Adresse.") val email: String,
    @field:NotBlank(message = "Passwort ist erforderlich.") val password: String,
)

data class RegisterRequest(
    @field:Email(message = "Ungültige E-Mail-Adresse.") val email: String,
    @field:Size(min = 2, message = "Name muss mindestens 2 Zeichen lang sein.") val name: String,
    @field:Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein.") val password: String,
)

data class MagicLinkRequest(
    @field:NotBlank(message = "E-Mail ist erforderlich.")
    @field:Email(message = "Ungültige E-Mail-Adresse.")
    @field:Size(max = 320, message = "E-Mail-Adresse ist zu lang.")
    val email: String,
)
data class VerifyTokenRequest(@field:NotBlank val token: String)

data class UserDto(
    val id: String,
    val email: String,
    val name: String,
    val avatarUrl: String?,
    val plan: String,
    val createdAt: Instant,
)

data class AuthResponse(val user: UserDto, val expiresAt: Instant)
data class MagicLinkResponse(val message: String, val expiresInSeconds: Long)

fun UserEntity.toDto() = UserDto(id, email, name, avatarUrl, plan, createdAt)
