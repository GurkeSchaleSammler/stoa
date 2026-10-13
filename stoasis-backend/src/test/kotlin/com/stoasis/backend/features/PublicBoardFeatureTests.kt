package com.stoasis.backend.features

import com.stoasis.backend.domains.collection.model.Visibility
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

/** Verifies anonymous read-only access for public and tokenized boards. */
class PublicBoardFeatureTests : FeatureTestSupport() {
    @Test
    fun `private board is indistinguishable from a missing board for anonymous viewers`() {
        val id = board(user())

        mvc.get("/api/public/collections/$id").andExpect { status { isNotFound() } }
        mvc.get("/api/public/collections/$id/pins").andExpect { status { isNotFound() } }
    }

    @Test
    fun `public board and pins are visible without a session`() {
        val owner = user()
        val id = board(owner, "Public resources")
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Shared note"}}"""
        }.andExpect { status { isCreated() } }
        collections.setVisibility(collections.get(id), Visibility.public)

        mvc.get("/api/public/collections/$id").andExpect {
            status { isOk() }
            jsonPath("$.name", `is`("Public resources"))
            jsonPath("$.visibility", `is`("public"))
        }
        mvc.get("/api/public/collections/$id/pins").andExpect {
            status { isOk() }
            jsonPath("$[0].data.content", `is`("Shared note"))
        }
    }

    @Test
    fun `link board requires its share token`() {
        val id = board(user(), "Secret resources")
        val collection = collections.get(id)
        collections.setVisibility(collection, Visibility.link)
        val token = collection.inviteToken!!

        mvc.get("/api/public/collections/$id").andExpect { status { isNotFound() } }
        mvc.get("/api/public/collections/$id") { param("token", "wrong") }
            .andExpect { status { isNotFound() } }
        mvc.get("/api/public/collections/$id") { param("token", token) }.andExpect {
            status { isOk() }
            jsonPath("$.visibility", `is`("link"))
        }
    }
}
