package com.stoasis.backend.domains.profile.api

import jakarta.validation.constraints.Size

data class UpdateProfileRequest(
    @field:Size(min = 2, message = "Name muss mindestens 2 Zeichen lang sein.")
    val name: String? = null,
    val avatarUrl: String? = null,
)

data class ImportResult(val imported: Int, val skipped: Int, val errors: List<String>)
