package com.stoasis.backend.features

import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post

/** Verifies private system boards, skill limits and explicit read-only sharing. */
class ProfileSkillFeatureTests : FeatureTestSupport() {
    @Test
    fun `registration creates both private non deletable skill boards`() {
        val email = "${java.util.UUID.randomUUID()}@example.com"
        val result = mvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"New User","email":"$email","password":"test1234"}"""
        }.andExpect { status { isCreated() } }.andReturn()
        val auth = result.request.getSession(false) as org.springframework.mock.web.MockHttpSession
        val list = mvc.get("/api/profile-boards") { this.session = auth }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(2))
            jsonPath("$[0].visibility", `is`("private"))
        }.andReturn()
        val id = json(list.response.contentAsString).get(0).get("id").asString()
        mvc.delete("/api/collections/$id") { this.session = auth }.andExpect { status { isConflict() } }
        mvc.post("/api/collections/$id/pins") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Wrong type"}}"""
        }.andExpect { status { isBadRequest() } }
    }

    @Test
    fun `free skill limit spans both boards and keeps existing skills editable`() {
        val user = user()
        val auth = sessionFor(user)
        mvc.get("/api/profile-boards") { this.session = auth }.andExpect { status { isOk() } }
        repeat(12) { index ->
            mvc.post("/api/profile-boards/${if (index % 2 == 0) "WORK" else "PERSONAL"}/skills") {
                this.session = auth
                contentType = MediaType.APPLICATION_JSON
                content = """{"skillName":"Skill $index","level":"BEGINNER"}"""
            }.andExpect { status { isOk() } }
        }
        mvc.post("/api/profile-boards/WORK/skills") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"skillName":"One more","level":"BEGINNER"}"""
        }.andExpect { status { isConflict() } }
        val result = mvc.get("/api/profile-boards") { this.session = auth }.andReturn()
        val skillId = json(result.response.contentAsString).get(0).get("skills").get(0).get("id").asString()
        mvc.patch("/api/profile-boards/WORK/skills/$skillId") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"skillName":"Updated","level":"EXPERT"}"""
        }.andExpect { status { isOk() } }
    }

    @Test
    fun `premium sharing requires the correct token and grants no writes`() {
        val owner = user("premium")
        val auth = sessionFor(owner)
        mvc.get("/api/profile-boards") { this.session = auth }
        val result = mvc.patch("/api/profile-boards/WORK/visibility") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"link"}"""
        }.andExpect { status { isOk() } }.andReturn()
        val board = json(result.response.contentAsString)
        val id = board.get("id").asString()
        mvc.get("/api/public/profile-boards/$id") { param("token", "wrong") }.andExpect { status { isForbidden() } }
        mvc.get("/api/public/profile-boards/$id") { param("token", board.get("shareToken").asString()) }.andExpect { status { isOk() } }
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(user())
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"skill","data":{"skillName":"Forbidden","level":"BEGINNER"}}"""
        }.andExpect { status { isForbidden() } }
        owner.plan = "free"
        users.saveAndFlush(owner)
        mvc.patch("/api/profile-boards/WORK/visibility") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"private"}"""
        }.andExpect { status { isOk() } }
        mvc.patch("/api/profile-boards/WORK/visibility") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"public"}"""
        }.andExpect { status { isForbidden() } }
    }
}
