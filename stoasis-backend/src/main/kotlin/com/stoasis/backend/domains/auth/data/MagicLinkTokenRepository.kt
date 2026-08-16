package com.stoasis.backend.domains.auth.data

import java.time.Instant
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MagicLinkTokenRepository : JpaRepository<MagicLinkTokenEntity, String> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        update MagicLinkTokenEntity token
        set token.used = true
        where token.token = :token and token.used = false and token.expiresAt >= :now
        """,
    )
    fun markUsedIfValid(@Param("token") token: String, @Param("now") now: Instant): Int
}
