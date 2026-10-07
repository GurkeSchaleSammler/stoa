package com.stoasis.backend.features

import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.collection.data.CollectionMemberEntity
import com.stoasis.backend.domains.collection.data.CollectionMemberRepository
import com.stoasis.backend.domains.collection.data.BoardPresenceRepository
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

class BoardPresenceFeatureTests : FeatureTestSupport() {
    @Autowired private lateinit var entityManager: jakarta.persistence.EntityManager
    @Autowired private lateinit var members: CollectionMemberRepository
    @Autowired private lateinit var presence: BoardPresenceRepository
    @Autowired private lateinit var service: com.stoasis.backend.domains.collection.application.BoardPresenceService

    private fun join(boardId: String, viewer: UserEntity) = members.saveAndFlush(
        CollectionMemberEntity(collection = boards.getReferenceById(boardId), user = viewer, role = Role.viewer),
    )

    private fun exchange(boardId: String, actor: UserEntity, client: String, cursor: String = "null") = mvc.perform(
        post("/api/collections/$boardId/presence/$client").session(sessionFor(actor))
            .contentType(MediaType.APPLICATION_JSON).content("""{"cursor":$cursor}"""),
    )

    @Test
    fun `members including viewers see other members cursors but never themselves or another board`() {
        val owner = user()
        val viewer = user().also { it.name = "Viewer <script>" }
        val boardId = board(owner)
        join(boardId, viewer)
        val clientA = UUID.randomUUID().toString()
        val clientB = UUID.randomUUID().toString()
        exchange(boardId, viewer, clientB, """{"x":140,"y":280}""").andExpect(status().isOk)
        val people = json(exchange(boardId, owner, clientA).andExpect(status().isOk).andReturn().response.contentAsString)
        assertEquals(1, people.size())
        assertEquals(viewer.id, people[0]["userId"].asString())
        assertEquals(viewer.name, people[0]["name"].asString())
        assertEquals(140.0, people[0]["cursor"]["x"].asDouble())
        assertFalse(people[0].has("email"))
        assertEquals(0, json(exchange(board(owner), owner, clientA).andReturn().response.contentAsString).size())
        exchange(boardId, viewer, clientB).andExpect(status().isOk)
        assertTrue(json(exchange(boardId, owner, clientA).andReturn().response.contentAsString)[0]["cursor"].isNull)
    }

    @Test
    fun `public visibility does not grant access to member presence and revoked members disappear`() {
        val owner = user()
        val stranger = user()
        val boardId = board(owner)
        boards.getReferenceById(boardId).visibility = Visibility.public
        val client = UUID.randomUUID().toString()
        mvc.perform(post("/api/collections/$boardId/presence/$client").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnauthorized)
        exchange(boardId, stranger, client).andExpect(status().isForbidden)
        val member = join(boardId, stranger)
        exchange(boardId, stranger, client, """{"x":1,"y":2}""").andExpect(status().isOk)
        // Real requests have separate persistence contexts; do not retain the deleted FK target.
        entityManager.clear()
        members.deleteById(member.id!!)
        members.flush()
        entityManager.clear()
        exchange(boardId, stranger, client).andExpect(status().isForbidden)
        assertEquals(0, json(exchange(boardId, owner, UUID.randomUUID().toString()).andReturn().response.contentAsString).size())
    }

    @Test
    fun `tabs are isolated deduplicated and expire without leaving ghost cursors`() {
        val owner = user()
        val viewer = user()
        val boardId = board(owner)
        val membership = join(boardId, viewer)
        val tabA = UUID.randomUUID().toString()
        val tabB = UUID.randomUUID().toString()
        val ownerTab = UUID.randomUUID().toString()
        exchange(boardId, viewer, tabA, """{"x":1,"y":2}""")
        exchange(boardId, viewer, tabB, """{"x":30,"y":40}""")
        assertEquals(1, json(exchange(boardId, owner, ownerTab).andReturn().response.contentAsString).size())
        exchange(boardId, viewer, tabB)
        assertEquals(1.0, json(exchange(boardId, owner, ownerTab).andReturn().response.contentAsString)[0]["cursor"]["x"].asDouble())
        mvc.perform(delete("/api/collections/$boardId/presence/$tabA").session(sessionFor(owner))).andExpect(status().isNoContent)
        assertEquals(2, presence.countByMemberId(membership.id!!))
        mvc.perform(delete("/api/collections/$boardId/presence/$tabA").session(sessionFor(viewer))).andExpect(status().isNoContent)
        assertEquals(1, presence.countByMemberId(membership.id!!))
        presence.findByMemberIdAndClientId(membership.id!!, tabB)!!.seenAt = Instant.EPOCH
        presence.flush()
        assertEquals(0, json(exchange(boardId, owner, ownerTab).andReturn().response.contentAsString).size())
        service.expire()
        assertEquals(0, presence.countByMemberId(membership.id!!))
    }

    @Test
    fun `invalid coordinates and unbounded clients are rejected`() {
        val owner = user()
        val boardId = board(owner)
        exchange(boardId, owner, UUID.randomUUID().toString(), """{"x":-1,"y":2}""").andExpect(status().isBadRequest)
        exchange(boardId, owner, UUID.randomUUID().toString(), """{"x":2241,"y":2}""").andExpect(status().isBadRequest)
        exchange(boardId, owner, "invalid-client").andExpect(status().isBadRequest)
        repeat(8) { exchange(boardId, owner, UUID.randomUUID().toString()).andExpect(status().isOk) }
        exchange(boardId, owner, UUID.randomUUID().toString()).andExpect(status().isTooManyRequests)
    }
}
