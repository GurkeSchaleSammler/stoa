package com.stoasis.backend.domains.auth.api

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class MagicLinkRequest(
    @field:NotBlank(message = "E-Mail ist erforderlich.")
    @field:Email(message = "Ungültige E-Mail-Adresse.")
    @field:Size(max = 320, message = "E-Mail-Adresse ist zu lang.")
    val email: String,
)
