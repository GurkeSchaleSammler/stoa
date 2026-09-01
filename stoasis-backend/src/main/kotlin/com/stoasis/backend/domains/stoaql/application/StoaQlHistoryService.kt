package com.stoasis.backend.domains.stoaql.application

import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.stoaql.api.StoaQlException
import com.stoasis.backend.domains.stoaql.api.StoaQlHistoryItem
import com.stoasis.backend.domains.stoaql.api.StoaQlQueryRequest
import com.stoasis.backend.domains.stoaql.api.StoaQlQueryResponse
import com.stoasis.backend.domains.stoaql.data.StoaQlQueryHistoryEntity
import com.stoasis.backend.domains.stoaql.data.StoaQlQueryHistoryRepository
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import java.util.UUID
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class StoaQlHistoryService(
    private val history: StoaQlQueryHistoryRepository,
    private val collections: CollectionService,
) {
    @Transactional(readOnly = true)
    fun list(userId: String, collectionReference: String, limit: Int): List<StoaQlHistoryItem> {
        val collectionId = collections.resolve(collectionReference, userId).id
        return history.findAllByUserIdAndCollectionIdOrderByCreatedAtDesc(
            userId,
            collectionId,
            PageRequest.of(0, limit.coerceIn(1, MAX_HISTORY_LIMIT)),
        ).map(::toDto)
    }

    @Transactional
    fun clear(userId: String, collectionReference: String) {
        val collectionId = collections.resolve(collectionReference, userId).id
        history.deleteAllByUserIdAndCollectionId(userId, collectionId)
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun recordSuccess(userId: String, request: StoaQlQueryRequest, response: StoaQlQueryResponse) {
        history.save(
            entity(
                userId = userId,
                request = request,
                queryId = response.queryId,
                success = true,
                operationCount = response.operations.size,
                resultCount = response.results.size,
                durationMs = response.durationMs,
            ),
        )
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun recordFailure(userId: String, request: StoaQlQueryRequest, error: StoaQlException) {
        history.save(
            entity(
                userId = userId,
                request = request,
                success = false,
                errorCode = error.code,
            ),
        )
    }

    private fun entity(
        userId: String,
        request: StoaQlQueryRequest,
        queryId: String? = null,
        success: Boolean,
        operationCount: Int = 0,
        resultCount: Int = 0,
        durationMs: Long? = null,
        errorCode: String? = null,
    ) = StoaQlQueryHistoryEntity(
        id = "history-${UUID.randomUUID().toString().take(12)}",
        userId = userId,
        collectionId = resolveHistoryCollection(request.context?.collectionId, userId),
        queryId = queryId,
        query = request.query,
        languageVersion = request.languageVersion,
        dryRun = request.dryRun,
        success = success,
        operationCount = operationCount,
        resultCount = resultCount,
        durationMs = durationMs,
        errorCode = errorCode,
        createdAt = Instant.now(),
    )

    private fun resolveHistoryCollection(reference: String?, userId: String): String? {
        if (reference == null) return null
        return try {
            collections.resolve(reference, userId).id
        } catch (_: ApiException) {
            null
        }
    }

    private fun toDto(entity: StoaQlQueryHistoryEntity) = StoaQlHistoryItem(
        id = entity.id,
        queryId = entity.queryId,
        query = entity.query,
        languageVersion = entity.languageVersion,
        dryRun = entity.dryRun,
        success = entity.success,
        operationCount = entity.operationCount,
        resultCount = entity.resultCount,
        durationMs = entity.durationMs,
        errorCode = entity.errorCode,
        createdAt = entity.createdAt,
    )

    companion object {
        private const val MAX_HISTORY_LIMIT = 100
    }
}
