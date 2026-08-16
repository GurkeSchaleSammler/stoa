package com.stoasis.backend.domains.pin.data

import org.springframework.data.jpa.repository.JpaRepository

interface PinCommentRepository : JpaRepository<PinCommentEntity, Long>
