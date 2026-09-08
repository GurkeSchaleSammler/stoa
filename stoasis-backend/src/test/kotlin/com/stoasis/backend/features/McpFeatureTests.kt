package com.stoasis.backend.features

import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

/** Verifies premium-only MCP sessions and revocation independent of browser login. */
class McpFeatureTests : FeatureTestSupport() {
    @Test
    fun `free users cannot authorize MCP and retain normal API access`() {
        val user = user()
        val auth = sessionFor(user)
        mvc.get("/api/profile/mcp") { this.session = auth }.andExpect { jsonPath("$.eligible", `is`(false)) }
        mvc.post("/api/profile/mcp/connect") { this.session = auth }.andExpect { status { isForbidden() } }
        mvc.get("/api/collections") { this.session = auth }.andExpect { status { isOk() } }
    }

    @Test
    fun `revocation invalidates existing MCP sessions but preserves the browser`() {
        val owner = user("premium")
        val browser = sessionFor(owner)
        val mcp = sessionFor(owner)
        mvc.post("/api/profile/mcp/connect") { session = mcp }.andExpect { status { isOk() } }
        mvc.get("/api/profile/mcp/authorization") { session = mcp }.andExpect { status { isOk() } }
        mvc.delete("/api/profile/mcp") { session = browser }.andExpect { status { isNoContent() } }
        mvc.get("/api/profile/mcp/authorization") { session = mcp }.andExpect { status { isUnauthorized() } }
        mvc.get("/api/collections") { session = mcp }.andExpect { status { isUnauthorized() } }
        mvc.get("/api/collections") { session = browser }.andExpect { status { isOk() } }
        mvc.post("/api/profile/mcp/connect") { session = sessionFor(owner) }.andExpect { status { isOk() } }
    }

    @Test
    fun `downgrades stop existing MCP access without blocking the browser`() {
        val owner = user("premium")
        val mcp = sessionFor(owner)
        mvc.post("/api/profile/mcp/connect") { session = mcp }.andExpect { status { isOk() } }
        owner.plan = "free"
        users.saveAndFlush(owner)
        mvc.get("/api/collections") { session = mcp }.andExpect { status { isUnauthorized() } }
        mvc.get("/api/collections") { session = sessionFor(owner) }.andExpect { status { isOk() } }
    }
}
