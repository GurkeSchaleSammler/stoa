package com.stoasis.backend.features

import com.stoasis.backend.domains.collection.data.CollectionMemberEntity
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

/** Verifies search visibility, pagination, normalization and premium filters. */
class SearchFeatureTests : FeatureTestSupport() {
    @Test
    fun `search only exposes member or explicitly public pins`() {
        val owner = user()
        val other = user()
        val secret = board(other)
        val public = board(other)
        collections.setVisibility(collections.get(public), Visibility.public)
        listOf(secret, public).forEach { id ->
            mvc.post("/api/collections/$id/pins") {
                session = sessionFor(other)
                contentType = MediaType.APPLICATION_JSON
                content = """{"type":"note","data":{"content":"Unique needle"},"tags":[" Kotlin ","#KOTLIN"]}"""
            }.andExpect {
                status { isCreated() }
                jsonPath("$.tags", hasSize<Any>(1))
            }
        }
        mvc.get("/api/search") {
            session = sessionFor(owner)
            param("q", "Unique needle")
        }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(1))
            jsonPath("$[0].collectionId", `is`(public))
        }
        mvc.get("/api/search") {
            session = sessionFor(owner)
            param("tag", "#KOTLIN")
            param("type", "note")
        }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(1))
        }
    }

    @Test
    fun `pagination and boolean filters retain permission checks`() {
        val owner = user("premium")
        val id = board(owner)
        repeat(3) { index ->
            mvc.post("/api/collections/$id/pins") {
                session = sessionFor(owner)
                contentType = MediaType.APPLICATION_JSON
                content = """{"type":"note","data":{"content":"Paged $index"},"tags":["one","${if (index == 0) "two" else "three"}"]}"""
            }.andExpect { status { isCreated() } }
        }
        mvc.get("/api/search") {
            session = sessionFor(owner)
            param("q", "Paged")
            param("size", "2")
            param("page", "1")
        }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(1))
        }
        mvc.get("/api/search") {
            session = sessionFor(owner)
            param("tags", "one", "two")
            param("tagMode", "all")
        }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(1))
        }
        owner.plan = "free"
        mvc.get("/api/search") {
            session = sessionFor(owner)
            param("tags", "one", "two")
        }.andExpect { status { isForbidden() } }
        mvc.get("/api/search") {
            session = sessionFor(owner)
            param("q", "Paged")
        }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(3))
        }
    }

    @Test
    fun `viewer deleting a tag cannot change another owners pins`() {
        val owner = user()
        val viewer = user()
        val id = board(owner)
        val board = collections.get(id)
        board.members.add(CollectionMemberEntity(collection = board, user = viewer, role = Role.viewer))
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Tagged"},"tags":["protected-tag"]}"""
        }.andExpect { status { isCreated() } }
        mvc.delete("/api/tags/tag-protected-tag") { session = sessionFor(viewer) }.andExpect { status { isNoContent() } }
        mvc.get("/api/search") {
            session = sessionFor(owner)
            param("tag", "protected-tag")
        }.andExpect { jsonPath("$", hasSize<Any>(1)) }
    }

    @Test
    fun `saved searches and analytics are premium with owner scoped records`() {
        val owner = user("premium")
        val saved = mvc.post("/api/search/saved") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Work","query":{"q":"Kotlin","tags":["work"]}}"""
        }.andExpect { status { isCreated() } }.andReturn()
        val id = json(saved.response.contentAsString).get("id").asString()
        mvc.delete("/api/search/saved/$id") { session = sessionFor(user()) }.andExpect { status { isNotFound() } }
        mvc.get("/api/search/tag-analytics") { session = sessionFor(user()) }.andExpect { status { isForbidden() } }
        mvc.get("/api/search/saved") { session = sessionFor(owner) }.andExpect { jsonPath("$", hasSize<Any>(1)) }
    }
}
