package com.stoasis.backend.shared.web

import com.stoasis.backend.domains.stoaql.api.StoaQlError
import com.stoasis.backend.domains.stoaql.api.StoaQlErrorI18n
import com.stoasis.backend.domains.stoaql.api.StoaQlErrorResponse
import com.stoasis.backend.domains.stoaql.api.StoaQlException
import jakarta.validation.ConstraintViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.slf4j.LoggerFactory

@RestControllerAdvice
class ApiExceptionHandler {
    private val logger = LoggerFactory.getLogger(ApiExceptionHandler::class.java)
    @ExceptionHandler(StoaQlException::class)
    fun stoaQlException(exception: StoaQlException) = ResponseEntity.status(exception.status).body(
        StoaQlErrorResponse(
            error = StoaQlError(
                code = exception.code,
                message = StoaQlErrorI18n.message(exception.code, exception.message),
                column = exception.column,
                statementIndex = exception.statementIndex,
                hint = exception.hint?.let(StoaQlErrorI18n::hint),
            ),
        ),
    )

    @ExceptionHandler(ApiException::class)
    fun apiException(exception: ApiException) =
        ResponseEntity.status(exception.status).body(ApiError(exception.message, exception.code))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validation(exception: MethodArgumentNotValidException): ResponseEntity<ApiError> {
        val message = exception.bindingResult.fieldErrors.firstOrNull()?.defaultMessage
            ?: "Die Eingaben sind ungültig."
        val fieldErrors = exception.bindingResult.fieldErrors
            .groupBy { it.field }
            .mapValues { (_, errors) ->
                errors.mapNotNull { it.defaultMessage }.distinct().ifEmpty { listOf("Ungültiger Wert.") }
                    .joinToString("; ")
            }
        return ResponseEntity.badRequest().body(ApiError(message, "request.validation_failed", fieldErrors))
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun constraintViolation(exception: ConstraintViolationException) =
        ResponseEntity.badRequest().body(
            ApiError(exception.message ?: "Die Eingaben sind ungültig.", "request.validation_failed"),
        )

    @ExceptionHandler(AccessDeniedException::class)
    fun accessDenied() = ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiError("Kein Zugriff.", "authorization.denied"))

    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException::class)
    fun unsupportedMediaType() = ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
        .body(ApiError("Dateiformat nicht unterstützt."))

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException::class,
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException::class,
        org.springframework.web.bind.MissingServletRequestParameterException::class)
    fun malformedRequest() = ResponseEntity.badRequest().body(ApiError("Die Anfrage ist ungültig."))

    @ExceptionHandler(Exception::class)
    fun unexpected(exception: Exception): ResponseEntity<ApiError> {
        logger.error("Unhandled API exception", exception)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiError("Ein unerwarteter Fehler ist aufgetreten.", "server.internal_error"))
    }
}
