package com.stoasis.backend.domains.board.data

import org.springframework.data.jpa.repository.JpaRepository

interface PinStackChildRepository : JpaRepository<PinStackChildEntity, Long> {
    fun existsByPinId(pinId: String): Boolean
    fun findAllByStackId(stackId: String): List<PinStackChildEntity>
}
