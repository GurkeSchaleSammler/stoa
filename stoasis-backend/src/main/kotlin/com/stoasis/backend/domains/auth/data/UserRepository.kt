package com.stoasis.backend.domains.auth.data

import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<UserEntity, String> {
    fun findByEmailIgnoreCase(email: String): UserEntity?
    fun existsByEmailIgnoreCase(email: String): Boolean
}
