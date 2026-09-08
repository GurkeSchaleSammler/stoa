package com.stoasis.backend.domains.upload.application

import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

/** Bounds upload attempts per account within a minute. */
@Component
class UploadRateLimiter {
    private val attempts = mutableMapOf<String, MutableList<Instant>>()

    @Synchronized
    fun check(userId: String) {
        val now = Instant.now()
        val cutoff = now.minusSeconds(60)
        attempts.values.forEach { it.removeIf { time -> time.isBefore(cutoff) } }
        attempts.entries.removeIf { it.value.isEmpty() }
        val recent = attempts.getOrPut(userId) { mutableListOf() }
        if (recent.size >= 20) throw ApiException(HttpStatus.TOO_MANY_REQUESTS, "Zu viele Uploads. Bitte warte eine Minute.")
        recent.add(now)
    }
}
