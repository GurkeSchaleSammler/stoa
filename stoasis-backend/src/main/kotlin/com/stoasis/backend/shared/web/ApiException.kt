package com.stoasis.backend.shared.web

import org.springframework.http.HttpStatus

class ApiException(
    val status: HttpStatus,
    override val message: String,
    cause: Throwable? = null,
    val code: String = apiCodeForStatus(status),
) : RuntimeException(message, cause)

private fun apiCodeForStatus(status: HttpStatus): String = when (status) {
    HttpStatus.BAD_REQUEST -> "request.invalid"
    HttpStatus.UNAUTHORIZED -> "auth.required"
    HttpStatus.FORBIDDEN -> "authorization.denied"
    HttpStatus.NOT_FOUND -> "resource.not_found"
    HttpStatus.CONFLICT -> "request.conflict"
    HttpStatus.TOO_MANY_REQUESTS -> "rate_limit.exceeded"
    else -> "request.failed"
}
