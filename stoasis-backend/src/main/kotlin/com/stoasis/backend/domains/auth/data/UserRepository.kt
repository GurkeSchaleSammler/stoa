package com.stoasis.backend.domains.auth.data

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import jakarta.persistence.LockModeType

/** Loads accounts and locks quota-changing operations. */
interface UserRepository : JpaRepository<UserEntity, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UserEntity u where u.id = :id")
    fun lockById(id: String): UserEntity?

    fun findByEmailIgnoreCase(email: String): UserEntity?
    fun existsByAvatarUrl(avatarUrl: String): Boolean
    fun existsByEmailIgnoreCase(email: String): Boolean
}
