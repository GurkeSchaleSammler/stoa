package com.stoasis.backend

import com.stoasis.backend.shared.web.ApiExceptionHandler
import jakarta.validation.ConstraintViolationException
import jakarta.validation.Valid
import jakarta.validation.Validation
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.core.MethodParameter
import org.springframework.validation.BeanPropertyBindingResult
import org.springframework.validation.beanvalidation.SpringValidatorAdapter
import org.springframework.web.bind.MethodArgumentNotValidException

class ApiExceptionHandlerTests {
    private val handler = ApiExceptionHandler()

    data class Address(@field:Email val email: String)
    data class InvalidInput(
        @field:NotBlank @field:Size(min = 2) val name: String,
        @field:Valid val billing: Address,
        @field:Valid val shipping: Address,
    )

    fun acceptInput(input: InvalidInput) = Unit

    @Test
    fun `both validation paths preserve distinct fields and choose stable constraint codes`() {
        Validation.buildDefaultValidatorFactory().use { factory ->
            val input = InvalidInput("", Address("invalid"), Address("also-invalid"))
            val violations = factory.validator.validate(input)
            val response = handler.constraintViolation(ConstraintViolationException(violations))
            val reversed = handler.constraintViolation(ConstraintViolationException(violations.reversed().toSet()))
            val binding = BeanPropertyBindingResult(input, "input")
            SpringValidatorAdapter(factory.validator).validate(input, binding)
            val parameter = MethodParameter(javaClass.getMethod("acceptInput", InvalidInput::class.java), 0)
            val mvcResponse = handler.validation(MethodArgumentNotValidException(parameter, binding))

            assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
            assertEquals("request.validation_failed", response.body?.code)
            assertEquals(
                mapOf("name" to "request.required", "billing.email" to "request.invalid_email", "shipping.email" to "request.invalid_email"),
                response.body?.fieldErrors,
            )
            assertEquals(response.body?.fieldErrors, reversed.body?.fieldErrors)
            assertEquals(response.body?.fieldErrors, mvcResponse.body?.fieldErrors)
        }
    }

    @Test
    fun `uses a stable code for unsupported media types`() {
        val response = handler.unsupportedMediaType()

        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, response.statusCode)
        assertEquals("request.unsupported_media_type", response.body?.code)
    }

    @Test
    fun `uses a stable code for malformed requests`() {
        val response = handler.malformedRequest()

        assertEquals(HttpStatus.BAD_REQUEST, response.statusCode)
        assertEquals("request.malformed", response.body?.code)
    }
}
