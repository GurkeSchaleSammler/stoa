package com.stoasis.backend.domains.stoaql.data

import org.springframework.data.jpa.repository.JpaRepository

interface StoaQlQueryRequestRepository : JpaRepository<StoaQlQueryRequestEntity, String> {
    fun findByUserIdAndIdempotencyKey(userId: String, idempotencyKey: String): StoaQlQueryRequestEntity?
}
