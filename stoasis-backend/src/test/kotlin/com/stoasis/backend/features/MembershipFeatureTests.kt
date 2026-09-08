package com.stoasis.backend.features

import com.stoasis.backend.domains.collection.data.CollectionMemberEntity
import com.stoasis.backend.domains.collection.model.Role
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post

/** Verifies owner protection, viewer invitations and capacity at the API boundary. */
class MembershipFeatureTests : FeatureTestSupport() {
    @Test
    fun `last owner cannot be removed or demoted`() {
        val owner = user()
        val id = board(owner)
        val auth = sessionFor(owner)
        mvc.patch("/api/collections/$id/members/${owner.id}") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"role":"viewer"}"""
        }.andExpect { status { isConflict() } }
        mvc.delete("/api/collections/$id/members/${owner.id}") { this.session = auth }.andExpect { status { isConflict() } }
    }

    @Test
    fun `invites add viewers up to owner limit and show existing membership`() {
        val owner = user()
        val id = board(owner)
        val invite = mvc.patch("/api/collections/$id/invite") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"link"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.capacity.memberLimit", `is`(3))
        }.andReturn()
        val token = json(invite.response.contentAsString).get("token").asString()
        val joiner = user()
        mvc.post("/api/collections/join/$token") { session = sessionFor(joiner) }.andExpect { status { isOk() } }
        mvc.get("/api/invites/$token") { session = sessionFor(joiner) }.andExpect {
            jsonPath("$.collectionName", `is`("Test board"))
            jsonPath("$.alreadyMember", `is`(true))
        }
        mvc.post("/api/collections/join/$token") { session = sessionFor(user()) }.andExpect { status { isOk() } }
        mvc.post("/api/collections/join/$token") { session = sessionFor(user()) }.andExpect { status { isConflict() } }
        mvc.post("/api/collections/join/$token") { session = sessionFor(joiner) }.andExpect { status { isOk() } }
        mvc.get("/api/collections/$id/invite") { session = sessionFor(owner) }.andExpect {
            jsonPath("$.capacity.limitReason", `is`("Mitgliederlimit erreicht (3)."))
        }
    }

    @Test
    fun `shared board limit does not block solo boards or count joined boards`() {
        val owner = user()
        repeat(2) {
            val id = board(owner)
            mvc.patch("/api/collections/$id/invite") {
                session = sessionFor(owner)
                contentType = MediaType.APPLICATION_JSON
                content = """{"visibility":"link"}"""
            }.andExpect { status { isOk() } }
        }
        val solo = board(owner)
        mvc.patch("/api/collections/$solo/invite") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"link"}"""
        }.andExpect { status { isConflict() } }
        mvc.patch("/api/collections/$solo") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"public"}"""
        }.andExpect { status { isConflict() } }
        mvc.post("/api/collections/$solo/pins") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Still free"}}"""
        }.andExpect { status { isCreated() } }
        val other = user()
        val shared = board(other)
        collections.setVisibility(collections.get(shared), com.stoasis.backend.domains.collection.model.Visibility.link)
        val token = collections.get(shared).inviteToken!!
        mvc.post("/api/collections/join/$token") { session = sessionFor(owner) }.andExpect { status { isOk() } }
    }

    @Test
    fun `owner promotion respects the new owners existing shared boards`() {
        val owner = user()
        val candidate = user()
        repeat(2) {
            val shared = collections.get(board(candidate))
            collections.setVisibility(shared, com.stoasis.backend.domains.collection.model.Visibility.link)
        }
        val id = board(owner)
        val shared = collections.get(id)
        shared.members.add(CollectionMemberEntity(collection = shared, user = candidate, role = Role.viewer))
        boards.flush()
        mvc.patch("/api/collections/$id/members/${candidate.id}") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"role":"owner"}"""
        }.andExpect { status { isConflict() } }
    }

    @Test
    fun `editor can edit pins but cannot change sharing or ownership`() {
        val owner = user()
        val editor = user()
        val id = board(owner)
        val board = collections.get(id)
        board.members.add(CollectionMemberEntity(collection = board, user = editor, role = Role.editor))
        boards.flush()
        mvc.patch("/api/collections/$id") {
            session = sessionFor(editor)
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"public"}"""
        }.andExpect { status { isForbidden() } }
        mvc.patch("/api/collections/$id/members/${owner.id}") {
            session = sessionFor(editor)
            contentType = MediaType.APPLICATION_JSON
            content = """{"role":"viewer"}"""
        }.andExpect { status { isForbidden() } }
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(editor)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Editor"}}"""
        }.andExpect { status { isCreated() } }
    }
}
