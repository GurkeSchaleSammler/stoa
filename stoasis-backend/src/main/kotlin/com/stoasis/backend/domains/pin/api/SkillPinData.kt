package com.stoasis.backend.domains.pin.api

import com.stoasis.backend.domains.skill.model.SkillLevel

data class SkillPinData(
    val skillName: String,
    val level: SkillLevel,
    val yearsExperience: Int?,
) : PinData

