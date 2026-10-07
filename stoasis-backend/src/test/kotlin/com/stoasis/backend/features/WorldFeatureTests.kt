package com.stoasis.backend.features

import com.stoasis.backend.domains.auth.data.UserEntity
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.JsonNode

class WorldFeatureTests : FeatureTestSupport() {
    private fun createWorld(actor: UserEntity, startBoard: String, name: String = "Atlas"): JsonNode = json(
        mvc.perform(
            post("/api/worlds")
                .session(sessionFor(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name":"$name","emoji":"🗺️","startCollectionId":"$startBoard"}"""),
        ).andExpect(status().isCreated).andReturn().response.contentAsString,
    )

    private fun addBoard(actor: UserEntity, worldId: String, boardId: String) = mvc.perform(
        post("/api/worlds/$worldId/boards")
            .session(sessionFor(actor))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""{"collectionId":"$boardId"}"""),
    )

    private fun createPortal(
        actor: UserEntity,
        sourceId: String,
        worldId: String,
        targetId: String,
        withReturn: Boolean = false,
    ): JsonNode = json(
        mvc.perform(
            post("/api/collections/$sourceId/pins")
                .session(sessionFor(actor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{"type":"portal","data":{"worldId":"$worldId","targetCollectionId":"$targetId","label":"Weiter","emoji":"🚪","createReturnPortal":$withReturn}}""",
                ),
        ).andExpect(status().isCreated).andReturn().response.contentAsString,
    )

    @Test
    fun `free accounts get one world with at most five boards`() {
        val owner = user()
        val boardIds = (1..6).map { board(owner, "Board $it") }
        val world = createWorld(owner, boardIds.first())
        val worldId = world["id"].asString()

        boardIds.drop(1).take(4).forEach { addBoard(owner, worldId, it).andExpect(status().isOk) }
        addBoard(owner, worldId, boardIds.last()).andExpect(status().isConflict)
        mvc.perform(
            post("/api/worlds")
                .session(sessionFor(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name":"Second","startCollectionId":"${boardIds.first()}"}"""),
        ).andExpect(status().isConflict)

        val detail = json(
            mvc.perform(get("/api/worlds/$worldId").session(sessionFor(owner)))
                .andExpect(status().isOk).andReturn().response.contentAsString,
        )
        assertEquals(5, detail["boards"].size())
        assertEquals(5, detail["boardCount"].asInt())
        assertEquals(5, detail["limits"]["boardLimit"].asInt())
        assertEquals(1, detail["limits"]["worldLimit"].asInt())
        assertEquals("public", detail["visibility"].asString())
        mvc.perform(
            patch("/api/worlds/$worldId")
                .session(sessionFor(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"visibility":"private"}"""),
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `portal connects boards in one world and can create a reciprocal return`() {
        val owner = user()
        val start = board(owner, "Start")
        val destination = board(owner, "Gallery")
        val outsiderBoard = board(owner, "Outside")
        val worldId = createWorld(owner, start)["id"].asString()
        addBoard(owner, worldId, destination).andExpect(status().isOk)

        val portal = createPortal(owner, start, worldId, destination, withReturn = true)
        assertEquals("portal", portal["type"].asString())
        assertEquals(destination, portal["data"]["targetCollectionId"].asString())
        assertTrue(portal["data"]["available"].asBoolean())
        assertEquals(1, pins.findAllByCollectionIdOrderBySortOrder(destination).size)
        mvc.perform(delete("/api/collections/$destination").session(sessionFor(owner)))
            .andExpect(status().isConflict)
        mvc.perform(
            post("/api/collections/$outsiderBoard/pins/copy")
                .session(sessionFor(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"sourceCollectionId":"$start","pinId":"${portal["id"].asString()}"}"""),
        ).andExpect(status().isConflict)

        mvc.perform(
            post("/api/collections/$start/pins")
                .session(sessionFor(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{"type":"portal","data":{"worldId":"$worldId","targetCollectionId":"$outsiderBoard","label":"Invalid"}}""",
                ),
        ).andExpect(status().isConflict)

        val detail = json(
            mvc.perform(get("/api/worlds/$worldId").session(sessionFor(owner)))
                .andExpect(status().isOk).andReturn().response.contentAsString,
        )
        assertEquals(2, detail["portals"].size())
        assertEquals(1, detail["boards"].first { it["id"].asString() == start }["backlinkCount"].asInt())
        assertEquals(1, detail["boards"].first { it["id"].asString() == destination }["backlinkCount"].asInt())
    }

    @Test
    fun `published worlds expose only member boards and keep link tokens private`() {
        val owner = user("premium")
        val start = board(owner, "Start")
        val destination = board(owner, "Archive")
        val worldId = createWorld(owner, start)["id"].asString()
        addBoard(owner, worldId, destination).andExpect(status().isOk)
        createPortal(owner, start, worldId, destination)

        mvc.perform(get("/api/public/worlds/$worldId")).andExpect(status().isNotFound)
        val linked = json(
            mvc.perform(
                patch("/api/worlds/$worldId")
                    .session(sessionFor(owner))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"visibility":"link"}"""),
            ).andExpect(status().isOk).andReturn().response.contentAsString,
        )
        val token = linked["shareToken"].asString()
        assertTrue(token.isNotBlank())
        mvc.perform(get("/api/public/worlds/$worldId")).andExpect(status().isNotFound)
        val shared = json(
            mvc.perform(get("/api/public/worlds/$worldId").param("token", token))
                .andExpect(status().isOk).andReturn().response.contentAsString,
        )
        assertTrue(shared["shareToken"].isNull)
        assertEquals("", shared["ownerId"].asString())
        assertEquals(0, shared["limits"]["worldCount"].asInt())
        val content = json(
            mvc.perform(get("/api/public/worlds/$worldId/boards/$start").param("token", token))
                .andExpect(status().isOk).andReturn().response.contentAsString,
        )
        assertEquals("Start", content["collection"]["name"].asString())
        assertEquals("portal", content["pins"][0]["type"].asString())
        mvc.perform(get("/api/public/worlds/$worldId/boards/${board(owner, "Not a member")}").param("token", token))
            .andExpect(status().isNotFound)

        val published = json(
            mvc.perform(
                patch("/api/worlds/$worldId")
                    .session(sessionFor(owner))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"visibility":"public"}"""),
            ).andExpect(status().isOk).andReturn().response.contentAsString,
        )
        assertTrue(published["shareToken"].isNull)
        mvc.perform(get("/api/public/worlds/$worldId")).andExpect(status().isOk)
    }

    @Test
    fun `deleting a world removes portals but preserves its boards`() {
        val owner = user("premium")
        val start = board(owner, "Start")
        val destination = board(owner, "Destination")
        val worldId = createWorld(owner, start)["id"].asString()
        addBoard(owner, worldId, destination).andExpect(status().isOk)
        createPortal(owner, start, worldId, destination, withReturn = true)
        assertEquals(2, pins.findAllByPortalWorldId(worldId).size)

        mvc.perform(delete("/api/worlds/$worldId").session(sessionFor(owner)))
            .andExpect(status().isNoContent)

        assertTrue(pins.findAllByPortalWorldId(worldId).isEmpty())
        assertNotNull(boards.findById(start).orElse(null))
        assertNotNull(boards.findById(destination).orElse(null))
        assertFalse(boards.findById(start).isEmpty)
    }
}
