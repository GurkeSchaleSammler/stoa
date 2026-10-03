package com.stoasis.backend.shared.web

data class ApiError(
    val message: String,
    val code: String,
    val fieldErrors: Map<String, String> = emptyMap(),
)
