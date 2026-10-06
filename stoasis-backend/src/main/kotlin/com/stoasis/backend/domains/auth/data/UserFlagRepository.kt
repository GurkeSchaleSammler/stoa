package com.stoasis.backend.domains.auth.data

import java.time.Instant
import java.time.OffsetDateTime
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository

data class UserFlag(val key: String, val outcome: String, val seenAt: Instant)

@Repository
class UserFlagRepository(private val jdbc: JdbcTemplate) {
    fun list(userId: String): List<UserFlag> = jdbc.query(
        "SELECT flag_key, outcome, seen_at FROM user_flags WHERE user_id = ? ORDER BY flag_key",
        { row, _ -> UserFlag(row.getString("flag_key"), row.getString("outcome"), row.getObject("seen_at", OffsetDateTime::class.java).toInstant()) },
        userId,
    )

    /** First acknowledgement wins, even with concurrent tabs; PostgreSQL and H2 PostgreSQL mode. */
    fun acknowledge(userId: String, key: String, outcome: String, seenAt: Instant) {
        jdbc.update(
            "INSERT INTO user_flags (user_id, flag_key, outcome, seen_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
            userId, key, outcome, OffsetDateTime.ofInstant(seenAt, java.time.ZoneOffset.UTC),
        )
    }
}
