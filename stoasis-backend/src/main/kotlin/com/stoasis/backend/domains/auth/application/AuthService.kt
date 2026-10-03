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
import com.stoasis.backend.domains.skill.application.ProfileBoardService
import java.time.Duration
import java.time.Instant
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
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
    private val magicLinkMailSender: MagicLinkMailSender,
    private val magicLinkRateLimiter: MagicLinkRateLimiter,
    private val profileBoards: ProfileBoardService,
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
                id = "user-${UUID.randomUUID().toString()}",
                email = email,
                name = request.name.trim(),
                passwordHash = passwordEncoder.encode(request.password),
            ),
        )
        profileBoards.ensureForUser(user)
        return user to response(user)
    }

    @Transactional
    fun requestMagicLink(email: String, remoteAddress: String): MagicLinkResponse {
        val normalizedEmail = email.trim().lowercase()
        magicLinkRateLimiter.check(normalizedEmail, remoteAddress)
        val token = Base64.getUrlEncoder().withoutPadding().encodeToString(ByteArray(32).also(secureRandom::nextBytes))
        val tokenHash = hashToken(token)
        tokens.save(
            MagicLinkTokenEntity(
                token = tokenHash,
                email = normalizedEmail,
                expiresAt = Instant.now().plus(Duration.ofMinutes(15)),
            ),
        )
        magicLinkMailSender.send(normalizedEmail, token)
        return MagicLinkResponse("Wenn die Adresse gültig ist, wurde ein Magic Link versendet.", 900)
    }

    @Transactional
    fun verify(token: String): Pair<UserEntity, AuthResponse> {
        val tokenHash = hashToken(token)
        val entry = tokens.findById(tokenHash).orElseThrow {
            ApiException(HttpStatus.BAD_REQUEST, "Ungültiger Link.")
        }
        if (entry.used) throw ApiException(HttpStatus.BAD_REQUEST, "Dieser Link wurde bereits verwendet.")
        val now = Instant.now()
        if (entry.expiresAt.isBefore(now)) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Dieser Link ist abgelaufen.")
        }
        if (tokens.markUsedIfValid(tokenHash, now) != 1) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Dieser Link wurde bereits verwendet.")
        }
        val existingUser = users.findByEmailIgnoreCase(entry.email)
        val user = existingUser ?: users.save(
            UserEntity(
                id = "user-${UUID.randomUUID().toString()}",
                email = entry.email,
                name = entry.email.substringBefore('@'),
            ),
        )
        if (existingUser == null) profileBoards.ensureForUser(user)
        return user to response(user)
    }

    private fun response(user: UserEntity) =
        AuthResponse(user.toDto(), Instant.now().plus(sessionDuration))

    private fun hashToken(token: String): String = MessageDigest.getInstance("SHA-256")
        .digest(token.toByteArray())
        .joinToString("") { (it.toInt() and 0xff).toString(16).padStart(2, '0') }

    companion object {
        private val secureRandom = SecureRandom()
    }
}
