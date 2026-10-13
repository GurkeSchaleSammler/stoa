package com.stoasis.backend.domains.pin.api

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CopyPinRequest(
    @field:NotBlank @field:Size(max = 64) val sourceCollectionId: String,
    @field:NotBlank @field:Size(max = 64) val pinId: String,
)
