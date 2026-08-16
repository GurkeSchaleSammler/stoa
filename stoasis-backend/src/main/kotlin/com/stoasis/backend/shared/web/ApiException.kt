package com.stoasis.backend.shared.web

import org.springframework.http.HttpStatus

class ApiException(
    val status: HttpStatus,
    override val message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)
