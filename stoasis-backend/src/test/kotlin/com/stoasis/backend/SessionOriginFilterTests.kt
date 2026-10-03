package com.stoasis.backend

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import com.stoasis.backend.shared.security.SessionOriginFilter
import tools.jackson.databind.json.JsonMapper

class SessionOriginFilterTests {
    private val filter = SessionOriginFilter("https://stoasis.example", JsonMapper.builder().build())

    @Test
    fun `allows mutating requests from the configured browser origin`() {
        val request = request("https://stoasis.example")
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertEquals(200, response.status)
        assertTrue(chain.request != null)
    }

    @Test
    fun `rejects mutating requests from an untrusted browser origin`() {
        val request = request("https://attacker.example")
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertEquals(403, response.status)
        assertTrue(chain.request == null)
    }

    private fun request(origin: String) = MockHttpServletRequest("POST", "/api/collections").apply {
        getSession(true)
        addHeader("Origin", origin)
    }
}
