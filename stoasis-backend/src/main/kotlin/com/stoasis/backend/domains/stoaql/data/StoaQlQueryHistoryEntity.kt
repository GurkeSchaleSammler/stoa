package com.stoasis.backend.domains.stoaql.data

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "stoaql_query_history")
class StoaQlQueryHistoryEntity(
    @Id var id: String = "",
    @Column(name = "user_id", nullable = false) var userId: String = "",
    @Column(name = "collection_id") var collectionId: String? = null,
    @Column(name = "query_id") var queryId: String? = null,
    @Column(name = "query_text", nullable = false, columnDefinition = "TEXT") var query: String = "",
    @Column(name = "language_version", nullable = false, length = 16) var languageVersion: String = "1.0",
    @Column(name = "dry_run", nullable = false) var dryRun: Boolean = false,
    @Column(nullable = false) var success: Boolean = false,
    @Column(name = "operation_count", nullable = false) var operationCount: Int = 0,
    @Column(name = "result_count", nullable = false) var resultCount: Int = 0,
    @Column(name = "duration_ms") var durationMs: Long? = null,
    @Column(name = "error_code", length = 128) var errorCode: String? = null,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
)
