package com.stoasis.backend.domains.profile.application

import com.stoasis.backend.domains.auth.api.UserDto
import com.stoasis.backend.domains.auth.api.toDto
import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.profile.api.UpdateProfileRequest
import java.time.Duration
import java.time.Instant
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Updates account details and schedules account deletion. */
@Service
class ProfileService(
    private val users: UserRepository,
) {
    @Transactional
    fun update(userId: String, request: UpdateProfileRequest): UserDto {
        val user = users.getReferenceById(userId)
        request.name?.let { user.name = it.trim() }
        if (request.avatarUrl != null) user.avatarUrl = request.avatarUrl.ifBlank { null }
        return user.toDto()
    }

    @Transactional
    fun scheduleDeletion(userId: String) {
        users.getReferenceById(userId).deletionScheduledAt = Instant.now().plus(Duration.ofDays(30))
    }

}
