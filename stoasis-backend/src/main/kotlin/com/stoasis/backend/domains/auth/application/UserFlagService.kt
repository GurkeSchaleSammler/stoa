package com.stoasis.backend.domains.auth.application

import com.stoasis.backend.domains.auth.data.UserFlagRepository
import java.time.Clock
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserFlagService(private val flags: UserFlagRepository, private val clock: Clock) {
    @Transactional(readOnly = true)
    fun list(userId: String) = flags.list(userId)

    @Transactional
    fun acknowledge(userId: String, key: String, outcome: String) {
        flags.acknowledge(userId, key, outcome, clock.instant())
    }
}
