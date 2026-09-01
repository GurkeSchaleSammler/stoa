package com.stoasis.backend.domains.stoaql

import com.stoasis.backend.domains.pin.data.PinRepository
import kotlin.test.assertEquals
import org.hamcrest.Matchers.`is`
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.startsWith
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import tools.jackson.databind.ObjectMapper

@SpringBootTest
@AutoConfigureMockMvc
class StoaQlIntegrationTests {
    @Autowired private lateinit var mvc: MockMvc
    @Autowired private lateinit var pins: PinRepository
    @Autowired private lateinit var objectMapper: ObjectMapper

    @Test
    fun `open board context executes aliases without USE`() {
        val session = loginSession()
        val collectionId = createCollection(session, "StoaQL Integration")
        try {
            mvc.post("/api/v1/query") {
                this.session = session
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(
                    mapOf(
                        "query" to "ADD \"SSH\" AS ssh TEXT \"Secure Shell\" TAGS [\"security\"]; " +
                            "LINK \"https://example.com/docs\" AS docs TITLE \"Docs\"; " +
                            "CONNECT ssh -> docs; LAYOUT MINDMAP FROM ssh; GET ssh; " +
                            "FIND CONNECTED TO ssh DEPTH 1",
                        "context" to mapOf("collectionId" to collectionId),
                    ),
                )
            }.andExpect {
                status { isOk() }
                jsonPath("$.success", `is`(true))
                jsonPath("$.operations", hasSize<Any>(4))
                jsonPath("$.results", hasSize<Any>(2))
                jsonPath("$.results[0].data.data.title", `is`("SSH"))
                jsonPath("$.results[0].data.data.content", `is`("Secure Shell"))
                jsonPath("$.aliases.ssh", startsWith("pin-"))
                jsonPath("$.aliases.docs", startsWith("pin-"))
                jsonPath("$.results[1].data", hasSize<Any>(1))
            }
        } finally {
            mvc.delete("/api/collections/$collectionId") { this.session = session }
                .andExpect { status { isNoContent() } }
        }
    }

    @Test
    fun `dry run and failed queries do not persist earlier statements`() {
        val session = loginSession()
        val collectionId = createCollection(session, "StoaQL Atomicity")
        try {
            val before = pins.countByCollectionId(collectionId)
            mvc.post("/api/v1/query") {
                this.session = session
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(
                    mapOf(
                        "query" to "ADD \"Dry Run\" AS dry",
                        "dryRun" to true,
                        "context" to mapOf("collectionId" to collectionId),
                    ),
                )
            }.andExpect {
                status { isOk() }
                jsonPath("$.dryRun", `is`(true))
                jsonPath("$.operations", hasSize<Any>(1))
            }
            assertEquals(before, pins.countByCollectionId(collectionId))

            mvc.post("/api/v1/query") {
                this.session = session
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(
                    mapOf(
                        "query" to "ADD \"Rollback\" AS created; CONNECT created -> missing",
                        "context" to mapOf("collectionId" to collectionId),
                    ),
                )
            }.andExpect {
                status { isBadRequest() }
                jsonPath("$.error.code", `is`("STOAQL_UNKNOWN_ALIAS"))
                jsonPath("$.error.statementIndex", `is`(1))
            }
            assertEquals(before, pins.countByCollectionId(collectionId))
        } finally {
            mvc.delete("/api/collections/$collectionId") { this.session = session }
                .andExpect { status { isNoContent() } }
        }
    }

    @Test
    fun `idempotency key replays the first response without creating another pin`() {
        val session = loginSession()
        val collectionId = createCollection(session, "StoaQL Idempotency")
        try {
            val request = objectMapper.writeValueAsString(
                mapOf(
                    "query" to "ADD \"Exactly once\" AS once",
                    "idempotencyKey" to "integration-once-$collectionId",
                    "context" to mapOf("collectionId" to collectionId),
                ),
            )
            val first = mvc.post("/api/v1/query") {
                this.session = session
                contentType = MediaType.APPLICATION_JSON
                content = request
            }.andExpect { status { isOk() } }.andReturn()
            val second = mvc.post("/api/v1/query") {
                this.session = session
                contentType = MediaType.APPLICATION_JSON
                content = request
            }.andExpect { status { isOk() } }.andReturn()

            assertEquals(1, pins.countByCollectionId(collectionId))
            assertEquals(
                objectMapper.readTree(first.response.contentAsString).get("queryId").asString(),
                objectMapper.readTree(second.response.contentAsString).get("queryId").asString(),
            )
        } finally {
            mvc.delete("/api/collections/$collectionId") { this.session = session }
                .andExpect { status { isNoContent() } }
        }
    }

    @Test
    fun `history is persisted per board and can be cleared`() {
        val session = loginSession()
        val collectionId = createCollection(session, "StoaQL History")
        try {
            fun execute(query: String, dryRun: Boolean = false) = mvc.post("/api/v1/query") {
                this.session = session
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(
                    mapOf(
                        "query" to query,
                        "dryRun" to dryRun,
                        "context" to mapOf("collectionId" to collectionId),
                    ),
                )
            }

            execute("ADD \"Persisted\"").andExpect { status { isOk() } }
            execute("FIND \"Persisted\"", dryRun = true).andExpect { status { isOk() } }
            execute("GET missing").andExpect { status { isBadRequest() } }

            mvc.get("/api/v1/query/history") {
                this.session = session
                param("collectionId", collectionId)
            }.andExpect {
                status { isOk() }
                jsonPath("$", hasSize<Any>(3))
                jsonPath("$[0].query", `is`("GET missing"))
                jsonPath("$[0].success", `is`(false))
                jsonPath("$[0].errorCode", `is`("STOAQL_UNKNOWN_ALIAS"))
                jsonPath("$[1].dryRun", `is`(true))
                jsonPath("$[2].operationCount", `is`(1))
            }

            mvc.delete("/api/v1/query/history") {
                this.session = session
                param("collectionId", collectionId)
            }.andExpect { status { isNoContent() } }

            mvc.get("/api/v1/query/history") {
                this.session = session
                param("collectionId", collectionId)
            }.andExpect {
                status { isOk() }
                jsonPath("$", hasSize<Any>(0))
            }
        } finally {
            mvc.delete("/api/collections/$collectionId") { this.session = session }
                .andExpect { status { isNoContent() } }
        }
    }

    private fun createCollection(session: MockHttpSession, name: String): String {
        val response = mvc.post("/api/collections") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name","emoji":"⌘","allowedTypes":["note","link"]}"""
        }.andExpect { status { isCreated() } }.andReturn()
        return objectMapper.readTree(response.response.contentAsString).get("id").asString()
    }

    private fun loginSession(): MockHttpSession = mvc.post("/api/auth/login") {
        contentType = MediaType.APPLICATION_JSON
        content = """{"email":"du@stoa.test","password":"test1234"}"""
    }.andReturn().request.getSession(false) as MockHttpSession
}
