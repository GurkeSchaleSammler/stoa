package com.stoasis.backend.shared.web

import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class FeatureFlagsDto(val skillsEnabled: Boolean)

@RestController
@RequestMapping("/api/features")
class FeatureController(
    @Value("\${stoasis.features.skills-enabled}") private val skillsEnabled: Boolean,
) {
    @GetMapping
    fun flags() = FeatureFlagsDto(skillsEnabled)
}

