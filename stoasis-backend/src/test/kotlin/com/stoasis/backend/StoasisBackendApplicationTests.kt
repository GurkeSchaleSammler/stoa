package com.stoasis.backend

import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.delete

@SpringBootTest
@AutoConfigureMockMvc
class StoasisBackendApplicationTests {
    @Autowired
    private lateinit var mvc: MockMvc

    @Test
    fun `protected API rejects requests without a session`() {
        mvc.get("/api/collections").andExpect {
            status { isUnauthorized() }
            jsonPath("$.message", `is`("Nicht angemeldet."))
        }
    }

    @Test
    fun `local dump supports the frontend collection and pin flow`() {
        val login = mvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"du@stoa.test","password":"test1234"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.email", `is`("du@stoa.test"))
            jsonPath("$.user.plan", `is`("free"))
        }.andReturn()
        val session = login.request.getSession(false) as MockHttpSession

        mvc.get("/api/auth/me") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$.name", `is`("Du"))
        }
        mvc.get("/api/collections/coll-japan") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$.members", hasSize<Any>(3))
            jsonPath("$.currentUserRole", `is`("owner"))
        }
        mvc.get("/api/collections/coll-japan/pins") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(5))
            jsonPath("$[0].data.url", `is`("https://fly.io/blog/sqlite-internals/"))
        }
    }

    @Test
    fun `authenticated user can create update search and delete content`() {
        val session = loginSession()
        val collectionResponse = mvc.post("/api/collections") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Integration Test","emoji":"","allowedTypes":["note"]}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name", `is`("Integration Test"))
        }.andReturn()
        val collectionId = collectionResponse.response.contentAsString.field("id")

        val pinResponse = mvc.post("/api/collections/$collectionId/pins") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Backend Test","color":"green"},"tags":["kotlin"]}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.data.content", `is`("Backend Test"))
        }.andReturn()
        val pinId = pinResponse.response.contentAsString.field("id")

        mvc.patch("/api/collections/$collectionId/pins/$pinId") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"data":{"content":"Aktualisiert","color":"blue"}}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.data.content", `is`("Aktualisiert"))
        }
        mvc.get("/api/search") {
            this.session = session
            param("q", "Aktualisiert")
        }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(1))
            jsonPath("$[0].collectionName", `is`("Integration Test"))
        }
        mvc.delete("/api/collections/$collectionId/pins/$pinId") { this.session = session }
            .andExpect { status { isNoContent() } }
        mvc.delete("/api/collections/$collectionId") { this.session = session }
            .andExpect { status { isNoContent() } }
    }

    private fun loginSession(): MockHttpSession = mvc.post("/api/auth/login") {
        contentType = MediaType.APPLICATION_JSON
        content = """{"email":"du@stoa.test","password":"test1234"}"""
    }.andReturn().request.getSession(false) as MockHttpSession

    private fun String.field(name: String): String =
        Regex("\\\"$name\\\":\\\"([^\\\"]+)\\\"").find(this)?.groupValues?.get(1)
            ?: error("Feld $name fehlt in $this")
}
