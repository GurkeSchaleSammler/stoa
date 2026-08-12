package com.stoasis.backend.domains.auth.application

import com.stoasis.backend.domains.auth.api.AuthResponse
import com.stoasis.backend.domains.auth.api.LoginRequest
import com.stoasis.backend.domains.auth.api.MagicLinkResponse
import com.stoasis.backend.domains.auth.api.RegisterRequest
import com.stoasis.backend.domains.auth.api.toDto
import com.stoasis.backend.domains.auth.data.MagicLinkTokenEntity
import com.stoasis.backend.domains.auth.data.MagicLinkTokenRepository
import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.shared.web.ApiException
import java.time.Duration
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val users: UserRepository,
    private val tokens: MagicLinkTokenRepository,
    private val passwordEncoder: PasswordEncoder,
) {
    private val sessionDuration = Duration.ofDays(30)

    @Transactional(readOnly = true)
    fun login(request: LoginRequest): Pair<UserEntity, AuthResponse> {
        val user = users.findByEmailIgnoreCase(request.email.trim())
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "E-Mail oder Passwort falsch.")
        if (user.passwordHash == null || !passwordEncoder.matches(request.password, user.passwordHash)) {
            throw ApiException(HttpStatus.UNAUTHORIZED, "E-Mail oder Passwort falsch.")
        }
        return user to response(user)
    }

    @Transactional
    fun register(request: RegisterRequest): Pair<UserEntity, AuthResponse> {
        val email = request.email.trim().lowercase()
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException(HttpStatus.CONFLICT, "E-Mail bereits registriert.")
        }
        val user = users.save(
            UserEntity(
                id = "user-${UUID.randomUUID().toString().take(8)}",
                email = email,
                name = request.name.trim(),
                passwordHash = passwordEncoder.encode(request.password),
            ),
        )
        return user to response(user)
    }

    @Transactional
    fun requestMagicLink(email: String): MagicLinkResponse {
        val token = UUID.randomUUID().toString().replace("-", "").take(24)
        tokens.save(
            MagicLinkTokenEntity(
                token = token,
                email = email.trim().lowercase(),
                expiresAt = Instant.now().plus(Duration.ofMinutes(15)),
            ),
        )
        println("Magic Link: http://localhost:4200/auth/verify?token=$token")
        return MagicLinkResponse("Magic Link wurde versendet (siehe Server-Konsole).", 900)
    }

    @Transactional
    fun verify(token: String): Pair<UserEntity, AuthResponse> {
        val entry = tokens.findById(token).orElseThrow {
            ApiException(HttpStatus.BAD_REQUEST, "Ungültiger Link.")
        }
        if (entry.used) throw ApiException(HttpStatus.BAD_REQUEST, "Dieser Link wurde bereits verwendet.")
        if (entry.expiresAt.isBefore(Instant.now())) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Dieser Link ist abgelaufen.")
        }
        val user = users.findByEmailIgnoreCase(entry.email) ?: users.save(
            UserEntity(
                id = "user-${UUID.randomUUID().toString().take(8)}",
                email = entry.email,
                name = entry.email.substringBefore('@'),
            ),
        )
        entry.used = true
        return user to response(user)
    }

    private fun response(user: UserEntity) =
        AuthResponse(user.toDto(), Instant.now().plus(sessionDuration))
}
