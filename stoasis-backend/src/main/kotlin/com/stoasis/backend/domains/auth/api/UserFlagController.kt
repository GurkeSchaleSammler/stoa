package com.stoasis.backend.domains.auth.api

import com.stoasis.backend.domains.auth.application.UserFlagService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.validation.Valid
import jakarta.validation.constraints.Pattern
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

data class AcknowledgeFlagRequest(
    @field:Pattern(regexp = "completed|skipped") val outcome: String,
)

@RestController
@RequestMapping("/api/me/flags")
@org.springframework.validation.annotation.Validated
class UserFlagController(private val flags: UserFlagService, private val user: CurrentUser) {
    @GetMapping
    fun list() = flags.list(user.id())

    @PutMapping("/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun acknowledge(
        @PathVariable @Pattern(regexp = "tutorial\\.[a-z0-9.-]{1,80}") key: String,
        @Valid @RequestBody request: AcknowledgeFlagRequest,
    ) = flags.acknowledge(user.id(), key, request.outcome)
}
