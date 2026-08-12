package com.stoasis.backend.domains.auth.api

import com.stoasis.backend.domains.auth.application.AuthService
import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.shared.security.CurrentUser
import com.stoasis.backend.shared.security.SESSION_USER_ID
import com.stoasis.backend.shared.web.ApiException
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val auth: AuthService,
    private val users: UserRepository,
    private val currentUser: CurrentUser,
) {
    @PostMapping("/login")
    fun login(@Valid @RequestBody body: LoginRequest, request: HttpServletRequest): AuthResponse {
        val (user, response) = auth.login(body)
        startSession(request, user.id)
        return response
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody body: RegisterRequest, request: HttpServletRequest): AuthResponse {
        val (user, response) = auth.register(body)
        startSession(request, user.id)
        return response
    }

    @PostMapping("/magic-link")
    fun magicLink(@Valid @RequestBody body: MagicLinkRequest, request: HttpServletRequest) =
        auth.requestMagicLink(body.email, request.remoteAddr)

    @PostMapping("/verify")
    fun verify(@Valid @RequestBody body: VerifyTokenRequest, request: HttpServletRequest): AuthResponse {
        val (user, response) = auth.verify(body.token)
        startSession(request, user.id)
        return response
    }

    @GetMapping("/me")
    fun me() = users.findById(currentUser.id())
        .orElseThrow { ApiException(HttpStatus.UNAUTHORIZED, "Nicht angemeldet.") }
        .toDto()

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(request: HttpServletRequest) {
        request.getSession(false)?.invalidate()
    }

    private fun startSession(request: HttpServletRequest, userId: String) {
        request.getSession(false)?.invalidate()
        request.getSession(true).setAttribute(SESSION_USER_ID, userId)
    }
}
