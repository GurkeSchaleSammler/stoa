package com.stoasis.backend.domains.membership.api

import com.stoasis.backend.domains.membership.application.MembershipService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
class MembershipController(
    private val memberships: MembershipService,
    private val currentUser: CurrentUser,
) {
    @GetMapping("/api/collections/{collectionId}/members")
    fun list(@PathVariable collectionId: String) = memberships.list(collectionId, currentUser.id())

    @PatchMapping("/api/collections/{collectionId}/members/{userId}")
    fun updateRole(
        @PathVariable collectionId: String,
        @PathVariable userId: String,
        @RequestBody request: UpdateRoleRequest,
    ) = memberships.updateRole(collectionId, userId, currentUser.id(), request.role)

    @DeleteMapping("/api/collections/{collectionId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun remove(@PathVariable collectionId: String, @PathVariable userId: String) =
        memberships.remove(collectionId, userId, currentUser.id())

    @GetMapping("/api/collections/{collectionId}/invite")
    fun invite(@PathVariable collectionId: String, request: HttpServletRequest) =
        memberships.invite(collectionId, currentUser.id(), frontendBaseUrl(request))

    @PatchMapping("/api/collections/{collectionId}/invite")
    fun setInvite(
        @PathVariable collectionId: String,
        @RequestBody body: UpdateInviteRequest,
        request: HttpServletRequest,
    ) = memberships.setInvite(collectionId, currentUser.id(), body.visibility, frontendBaseUrl(request))

    @GetMapping("/api/invites/{token}")
    fun preview(@PathVariable token: String, request: HttpServletRequest) =
        memberships.preview(token, currentUser.id(), frontendBaseUrl(request))

    @PostMapping("/api/collections/join/{token}")
    fun join(@PathVariable token: String) = memberships.join(token, currentUser.id())

    private fun frontendBaseUrl(request: HttpServletRequest): String =
        request.getHeader("Origin")?.takeIf { it.startsWith("http") } ?: "http://localhost:4200"
}
