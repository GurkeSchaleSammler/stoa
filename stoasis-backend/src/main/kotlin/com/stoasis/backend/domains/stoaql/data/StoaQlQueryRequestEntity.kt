package com.stoasis.backend.domains.stoaql.data

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "stoaql_query_requests")
class StoaQlQueryRequestEntity(
    @Id var id: String = "",
    @Column(name = "user_id", nullable = false) var userId: String = "",
    @Column(name = "idempotency_key", nullable = false, length = 128) var idempotencyKey: String = "",
    @Column(name = "request_hash", nullable = false, length = 64) var requestHash: String = "",
    @Column(name = "response_json", nullable = false, columnDefinition = "TEXT") var responseJson: String = "",
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
)
