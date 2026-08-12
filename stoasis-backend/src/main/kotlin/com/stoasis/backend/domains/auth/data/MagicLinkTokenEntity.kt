package com.stoasis.backend.domains.auth.data

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import org.springframework.data.jpa.repository.JpaRepository

@Entity
@Table(name = "magic_link_tokens")
class MagicLinkTokenEntity(
    @Id var token: String = "",
    @Column(nullable = false) var email: String = "",
    @Column(name = "expires_at", nullable = false) var expiresAt: Instant = Instant.now(),
    @Column(nullable = false) var used: Boolean = false,
)

interface MagicLinkTokenRepository : JpaRepository<MagicLinkTokenEntity, String>
