package com.stoasis.backend.domains.auth.application

import com.stoasis.backend.shared.web.ApiException
import java.time.Duration
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

@Component
class MagicLinkRateLimiter {
    private val attempts = ConcurrentHashMap<String, Instant>()

    @Synchronized
    fun check(email: String, remoteAddress: String) {
        val now = Instant.now()
        listOf("email:${email.lowercase()}", "ip:$remoteAddress").forEach { key ->
            val previous = attempts[key]
            if (previous != null && Duration.between(previous, now) < MIN_INTERVAL) {
                throw ApiException(HttpStatus.TOO_MANY_REQUESTS, "Bitte warte kurz vor der nächsten Anfrage.")
            }
        }
        attempts["email:${email.lowercase()}"] = now
        attempts["ip:$remoteAddress"] = now
        if (attempts.size > MAX_TRACKED_KEYS) {
            attempts.entries.removeIf { Duration.between(it.value, now) > ENTRY_TTL }
        }
    }

    companion object {
        private val MIN_INTERVAL = Duration.ofSeconds(45)
        private val ENTRY_TTL = Duration.ofHours(1)
        private const val MAX_TRACKED_KEYS = 10_000
    }
}
