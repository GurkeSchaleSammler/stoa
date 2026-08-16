package com.stoasis.backend.domains.auth.api

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class LoginRequest(
    @field:Email(message = "Ungültige E-Mail-Adresse.") val email: String,
    @field:NotBlank(message = "Passwort ist erforderlich.") val password: String,
)
