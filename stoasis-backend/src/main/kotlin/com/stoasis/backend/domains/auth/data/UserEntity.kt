package com.stoasis.backend.domains.auth.data

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "users")
class UserEntity(
    @Id
    var id: String = "",
    @Column(nullable = false, unique = true)
    var email: String = "",
    @Column(nullable = false)
    var name: String = "",
    @Column(name = "avatar_url")
    var avatarUrl: String? = null,
    @Column(nullable = false)
    var plan: String = "free",
    @Column(name = "password_hash")
    var passwordHash: String? = null,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "deletion_scheduled_at")
    var deletionScheduledAt: Instant? = null,
)
