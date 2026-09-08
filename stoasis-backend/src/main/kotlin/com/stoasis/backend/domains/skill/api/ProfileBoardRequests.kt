package com.stoasis.backend.domains.skill.api

import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.skill.model.SkillLevel
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/** Validates skill name, proficiency and optional experience. */
data class SaveProfileSkillRequest(
    @field:NotBlank @field:Size(max = 120) val skillName: String,
    val level: SkillLevel,
    @field:Min(0) @field:Max(80) val yearsExperience: Int? = null,
)

/** Selects explicit profile visibility. */
data class UpdateProfileBoardVisibilityRequest(val visibility: Visibility)


/** Updates the accent used to present a profile board. */
data class UpdateProfileAccentRequest(val accent: String?)
