package com.stoasis.backend.domains.stoaql.api

import com.stoasis.backend.shared.i18n.StringI18n
import java.time.Instant

data class StoaQlContext(val collectionId: String? = null)

data class StoaQlQueryRequest(
    val query: String,
    val languageVersion: String = "1.0",
    val dryRun: Boolean = false,
    val atomic: Boolean = true,
    val `return`: String = "operations",
    val idempotencyKey: String? = null,
    val context: StoaQlContext? = null,
)

data class StoaQlOperation(
    val statementIndex: Int,
    val type: String,
    val entityId: String? = null,
    val data: Any? = null,
)

data class StoaQlResult(
    val statementIndex: Int,
    val type: String,
    val data: Any?,
)

data class StoaQlQueryResponse(
    val success: Boolean = true,
    val queryId: String,
    val languageVersion: String,
    val dryRun: Boolean,
    val operations: List<StoaQlOperation>,
    val results: List<StoaQlResult>,
    val aliases: Map<String, String>,
    val warnings: List<String>,
    val durationMs: Long,
)

data class StoaQlError(
    val code: String,
    val message: StringI18n,
    val line: Int = 1,
    val column: Int,
    val statementIndex: Int? = null,
    val hint: StringI18n? = null,
)

data class StoaQlErrorResponse(
    val success: Boolean = false,
    val error: StoaQlError,
)

data class StoaQlHistoryItem(
    val id: String,
    val queryId: String?,
    val query: String,
    val languageVersion: String,
    val dryRun: Boolean,
    val success: Boolean,
    val operationCount: Int,
    val resultCount: Int,
    val durationMs: Long?,
    val errorCode: String?,
    val createdAt: Instant,
)
