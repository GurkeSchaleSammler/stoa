package com.stoasis.backend.domains.auth.api

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:Email(message = "Ungültige E-Mail-Adresse.") val email: String,
    @field:Size(min = 2, message = "Name muss mindestens 2 Zeichen lang sein.") val name: String,
    @field:Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein.") val password: String,
)
