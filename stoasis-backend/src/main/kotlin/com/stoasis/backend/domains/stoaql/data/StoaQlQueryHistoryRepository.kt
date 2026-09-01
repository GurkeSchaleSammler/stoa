package com.stoasis.backend.domains.stoaql.data

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface StoaQlQueryHistoryRepository : JpaRepository<StoaQlQueryHistoryEntity, String> {
    fun findAllByUserIdAndCollectionIdOrderByCreatedAtDesc(
        userId: String,
        collectionId: String,
        pageable: Pageable,
    ): List<StoaQlQueryHistoryEntity>

    fun deleteAllByUserIdAndCollectionId(userId: String, collectionId: String): Long
}
