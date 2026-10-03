package com.stoasis.backend

import com.stoasis.backend.shared.security.SESSION_USER_ID
import com.stoasis.backend.shared.security.STOASIS_CLIENT_HEADER
import com.stoasis.backend.shared.security.STOASIS_MCP_CLIENT
import com.stoasis.backend.shared.security.SessionOriginFilter
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
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

    @Test
    fun `allows authenticated MCP mutations with the explicit client marker`() {
        val request = MockHttpServletRequest("POST", "/api/collections/collection-1/pins").apply {
            getSession(true)!!.setAttribute(SESSION_USER_ID, "user-1")
            addHeader("Cookie", "stoasis_session=mcp-session")
            addHeader(STOASIS_CLIENT_HEADER, STOASIS_MCP_CLIENT)
        }
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertEquals(200, response.status)
        assertTrue(chain.request != null)
    }

    @Test
    fun `rejects mutations without browser provenance or the MCP marker`() {
        val request = MockHttpServletRequest("POST", "/api/collections").apply {
            getSession(true)
        }
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertEquals(403, response.status)
        assertTrue(chain.request == null)
    }

    @Test
    fun `does not let the MCP marker override an untrusted browser origin`() {
        val request = request("https://attacker.example").apply {
            addHeader(STOASIS_CLIENT_HEADER, STOASIS_MCP_CLIENT)
        }
        val response = MockHttpServletResponse()
        val chain = MockFilterChain()

        filter.doFilter(request, response, chain)

        assertEquals(403, response.status)
        assertTrue(chain.request == null)
    }

    @Test
    fun `rejects cross-site browser mutation when Origin is absent`() {
        val request = MockHttpServletRequest("POST", "/api/collections").apply {
            getSession(true)
            addHeader("Sec-Fetch-Site", "cross-site")
        }
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
