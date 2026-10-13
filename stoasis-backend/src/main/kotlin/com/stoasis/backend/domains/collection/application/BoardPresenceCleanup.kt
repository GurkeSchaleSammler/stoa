package com.stoasis.backend.domains.collection.application

import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled

@Configuration
@EnableScheduling
class BoardPresenceCleanup(private val presence: BoardPresenceService) {
    @Scheduled(fixedDelay = 10000, initialDelay = 10000)
    fun expire() = presence.expire()
}
