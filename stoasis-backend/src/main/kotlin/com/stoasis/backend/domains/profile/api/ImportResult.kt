package com.stoasis.backend.domains.profile.api

/** Reports every parsed row and aggregate outcomes for preview or import. */
data class ImportResult(
    val imported: Int,
    val skipped: Int,
    val errors: List<String>,
    val duplicates: Int = 0,
    val failed: Int = 0,
    val ready: Int = 0,
    val rows: List<ImportRow> = emptyList(),
)

/** Describes one bookmark without interpreting its text as executable content. */
data class ImportRow(
    val row: Int,
    val title: String = "",
    val url: String? = null,
    val tags: List<String> = emptyList(),
    val status: String,
    val message: String? = null,
)
