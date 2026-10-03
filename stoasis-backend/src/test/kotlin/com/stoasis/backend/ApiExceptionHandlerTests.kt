package com.stoasis.backend

import com.stoasis.backend.shared.web.ApiExceptionHandler
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

class ApiExceptionHandlerTests {
    private val handler = ApiExceptionHandler()

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
