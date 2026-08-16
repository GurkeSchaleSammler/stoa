package com.stoasis.backend.shared.web

import jakarta.validation.ConstraintViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun apiException(exception: ApiException) =
        ResponseEntity.status(exception.status).body(ApiError(exception.message))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun validation(exception: MethodArgumentNotValidException): ResponseEntity<ApiError> {
        val message = exception.bindingResult.fieldErrors.firstOrNull()?.defaultMessage
            ?: "Die Eingaben sind ungültig."
        return ResponseEntity.badRequest().body(ApiError(message))
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun constraintViolation(exception: ConstraintViolationException) =
        ResponseEntity.badRequest().body(ApiError(exception.message ?: "Die Eingaben sind ungültig."))

    @ExceptionHandler(AccessDeniedException::class)
    fun accessDenied() = ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError("Kein Zugriff."))

    @ExceptionHandler(Exception::class)
    fun unexpected(exception: Exception): ResponseEntity<ApiError> {
        exception.printStackTrace()
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiError("Ein unerwarteter Fehler ist aufgetreten."))
    }
}
