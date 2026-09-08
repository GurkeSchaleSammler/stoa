package com.stoasis.backend.domains.mcp.api

import com.stoasis.backend.domains.mcp.application.McpAccessService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

/** Exposes connection status, premium authorization and account-wide revocation. */
@RestController
@RequestMapping("/api/profile/mcp")
class McpConnectionController(private val access: McpAccessService, private val currentUser: CurrentUser) {
    @GetMapping
    fun status() = access.status(currentUser.id())

    @PostMapping("/connect")
    fun connect(request: HttpServletRequest) = access.connect(currentUser.id(), request.session)

    @GetMapping("/authorization")
    fun authorize(request: HttpServletRequest) = access.authorize(currentUser.id(), request.session)

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun revoke() = access.revoke(currentUser.id())
}
