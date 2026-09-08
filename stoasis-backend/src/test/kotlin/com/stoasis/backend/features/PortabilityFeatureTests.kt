package com.stoasis.backend.features

import com.stoasis.backend.domains.collection.data.CollectionMemberEntity
import com.stoasis.backend.domains.collection.model.Role
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Verifies side-effect-free preview, row reports, export ownership and free limits. */
class PortabilityFeatureTests : FeatureTestSupport() {
    @Test
    fun `CSV preview handles quotes newlines duplicates and invalid rows without writing`() {
        val owner = user()
        val id = board(owner)
        val auth = sessionFor(owner)
        val csv = "title,url\r\n\"Two, words\",https://example.com/a\r\n\"Two\nlines\",https://example.com/b\r\nDuplicate,https://EXAMPLE.com:443/a\r\nUnsafe,javascript:alert(1)\r\n"
        mvc.post("/api/profile/import/pocket/preview") {
            this.session = auth
            param("collectionId", id)
            contentType = MediaType("text", "csv")
            content = csv
        }.andExpect {
            status { isOk() }
            jsonPath("$.ready", `is`(2))
            jsonPath("$.duplicates", `is`(1))
            jsonPath("$.failed", `is`(1))
        }
        assertEquals(0, pins.countByCollectionId(id))
        mvc.post("/api/profile/import/pocket") {
            this.session = auth
            param("collectionId", id)
            contentType = MediaType("text", "csv")
            content = csv
        }.andExpect {
            status { isOk() }
            jsonPath("$.imported", `is`(2))
            jsonPath("$.rows[0].title", `is`("Two, words"))
        }
        assertEquals(2, pins.countByCollectionId(id))
    }

    @Test
    fun `confirmation rejects changed files and destinations and free row overflow`() {
        val owner = user()
        val auth = sessionFor(owner)
        val id = board(owner)
        val csv = "title,url\nOne,https://example.com/one"
        mvc.post("/api/profile/import/pocket") {
            this.session = auth
            param("collectionId", id)
            contentType = MediaType("text", "csv")
            content = csv
        }.andExpect { status { isConflict() } }
        mvc.post("/api/profile/import/pocket/preview") {
            this.session = auth
            param("collectionId", id)
            contentType = MediaType("text", "csv")
            content = csv
        }.andExpect { status { isOk() } }
        mvc.post("/api/profile/import/pocket") {
            this.session = auth
            param("collectionId", id)
            contentType = MediaType("text", "csv")
            content = "$csv\nTwo,https://example.com/two"
        }.andExpect { status { isConflict() } }
        mvc.post("/api/profile/import/pocket/preview") {
            this.session = auth
            param("collectionId", id)
            contentType = MediaType("text", "csv")
            content = "title,url\n" + (1..101).joinToString("\n") { "Item $it,https://example.com/$it"
            }
        }.andExpect { status { isContentTooLarge() } }
        assertEquals(0, pins.countByCollectionId(id))
    }

    @Test
    fun `exports exclude joined boards and never contain credentials`() {
        val owner = user()
        val own = board(owner, "Owned")
        val foreign = board(user(), "Foreign")
        collections.get(foreign).members.add(CollectionMemberEntity(collection = collections.get(foreign), user = owner, role = Role.viewer))
        boards.flush()
        val result = mvc.get("/api/profile/export") { session = sessionFor(owner) }.andExpect { status { isOk() } }.andReturn()
        val text = result.response.contentAsString
        assertTrue(text.contains(own))
        assertFalse(text.contains(foreign))
        assertFalse(text.contains("passwordHash"))
        assertFalse(text.contains("inviteToken"))
        mvc.get("/api/profile/export") { session = sessionFor(owner) }.andExpect { status { isTooManyRequests() } }
    }

    @Test
    fun `premium CSV export neutralizes spreadsheet formulas and can be repeated`() {
        val owner = user("premium")
        val id = board(owner, "=HYPERLINK(1)")
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"link","data":{"title":"=1+1","url":"https://example.com"}}"""
        }.andExpect { status { isCreated() } }
        repeat(2) {
            val response = mvc.get("/api/profile/export") {
                session = sessionFor(owner)
                param("format", "csv") }.andExpect { status { isOk() }
            }.andReturn()
            assertTrue(response.response.contentAsString.contains("'=1+1"))
            assertTrue(response.response.contentAsString.contains("'=HYPERLINK"))
        }
    }
}
