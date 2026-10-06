package com.stoasis.backend.features

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class UserFlagFeatureTests : FeatureTestSupport() {
    @Test
    fun `browser origin can acknowledge tutorials via PUT`() {
        mvc.perform(options("/api/me/flags/tutorial.test.v1")
            .header("Origin", "http://localhost:4200")
            .header("Access-Control-Request-Method", "PUT"))
            .andExpect(status().isOk)
        mvc.perform(put("/api/me/flags/tutorial.test.v1").session(sessionFor(user()))
            .header("Origin", "http://localhost:4200")
            .contentType(MediaType.APPLICATION_JSON).content("""{"outcome":"skipped"}"""))
            .andExpect(status().isNoContent)
    }

    @Test
    fun `skip is persisted once and tutorial flags are isolated by user`() {
        val owner = user()
        val other = user()
        val key = "tutorial.board-templates.v1"
        for (outcome in listOf("skipped", "completed")) {
            mvc.perform(put("/api/me/flags/$key").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"outcome":"$outcome"}"""))
                .andExpect(status().isNoContent)
        }
        val saved = mapper.readTree(mvc.perform(get("/api/me/flags").session(sessionFor(owner)))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        assertEquals(1, saved.size())
        assertEquals(key, saved[0]["key"].asString())
        assertEquals("skipped", saved[0]["outcome"].asString())
        assertFalse(saved[0]["seenAt"].asString().isBlank())
        val empty = mapper.readTree(mvc.perform(get("/api/me/flags").session(sessionFor(other)))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        assertEquals(0, empty.size())
    }

    @Test
    fun `flags require authentication and validated keys and outcomes`() {
        mvc.perform(get("/api/me/flags")).andExpect(status().isUnauthorized)
        mvc.perform(put("/api/me/flags/not-a-tutorial").session(sessionFor(user())).contentType(MediaType.APPLICATION_JSON).content("""{"outcome":"skipped"}"""))
            .andExpect(status().isBadRequest)
        mvc.perform(put("/api/me/flags/tutorial.test.v1").session(sessionFor(user())).contentType(MediaType.APPLICATION_JSON).content("""{"outcome":"invalid"}"""))
            .andExpect(status().isBadRequest)
        mvc.perform(put("/api/me/flags/tutorial.test.v1").session(sessionFor(user())).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest)
        mvc.perform(put("/api/me/flags/tutorial.test.v1").session(sessionFor(user())).contentType(MediaType.APPLICATION_JSON).content("""{"outcome":null}"""))
            .andExpect(status().isBadRequest)
    }
}
