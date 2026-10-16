package com.stoasis.backend.features

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@Testcontainers
@SpringBootTest(properties = ["spring.flyway.locations=classpath:db/migration"])
class BoardExperiencePostgresTests : FeatureTestSupport() {
    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    fun `concurrent creates cannot exceed board capacity on PostgreSQL`() {
        val owner = user()
        val boardId = board(owner)
        val pinIds = (0..12).map {
            json(mvc.perform(post("/api/collections/$boardId/pins").session(sessionFor(owner))
                .contentType(MediaType.APPLICATION_JSON).content("""{"type":"note","data":{"content":"Station"}}"""))
                .andExpect(status().isCreated).andReturn().response.contentAsString)["id"].asString()
        }
        fun race(path: String, bodies: List<String>): Map<Int, Int> {
            val gate = CountDownLatch(1)
            val pool = Executors.newFixedThreadPool(12)
            try {
                val jobs = bodies.map { body -> pool.submit<Int> {
                    gate.await(10, TimeUnit.SECONDS)
                    mvc.perform(post(path).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content(body)).andReturn().response.status
                } }
                gate.countDown()
                return jobs.map { it.get(30, TimeUnit.SECONDS) }.groupingBy { it }.eachCount()
            } finally { pool.shutdownNow() }
        }
        assertEquals(mapOf(201 to 7, 409 to 5), race("/api/collections/$boardId/experience/paths", (1..12).map {
            """{"name":"Path $it","pinIds":["${pinIds[0]}"]}"""
        }))
        assertEquals(mapOf(201 to 10, 409 to 2), race("/api/collections/$boardId/board-elements/connectors", pinIds.drop(1).map {
            """{"sourcePinId":"${pinIds[0]}","targetPinId":"$it","label":"Related"}"""
        }))
    }

    companion object {
        @Container @JvmStatic val postgres = PostgreSQLContainer<Nothing>("postgres:16-alpine")
        @DynamicPropertySource @JvmStatic fun datasource(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.datasource.driver-class-name") { "org.postgresql.Driver" }
        }
    }
}
