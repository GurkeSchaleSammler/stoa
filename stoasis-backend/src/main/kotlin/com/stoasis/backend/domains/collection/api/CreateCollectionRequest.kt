package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.model.PinType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty

data class CreateCollectionRequest(
    @field:NotBlank(message = "Name ist erforderlich.") val name: String,
    val emoji: String = "📌",
    @field:NotEmpty(message = "Mindestens ein Pin-Typ ist erforderlich.")
    val allowedTypes: Set<PinType>,
)
