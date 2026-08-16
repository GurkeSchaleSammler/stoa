package com.stoasis.backend.domains.auth.api

import jakarta.validation.constraints.NotBlank

data class VerifyTokenRequest(@field:NotBlank val token: String)
