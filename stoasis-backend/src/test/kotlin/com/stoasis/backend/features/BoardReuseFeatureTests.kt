package com.stoasis.backend.features

import com.stoasis.backend.domains.auth.data.UserEntity
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.JsonNode

class BoardReuseFeatureTests : FeatureTestSupport() {
    private fun create(path: String, actor: UserEntity, body: String): JsonNode = mapper.readTree(
        mvc.perform(post(path).session(sessionFor(actor)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated).andReturn().response.contentAsString,
    )

    @Test
    fun `all five templates create private editable styled boards in the requested language`() {
        val owner = user()
        val catalog = mapper.readTree(mvc.perform(get("/api/collections/templates?language=en").session(sessionFor(owner)))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        assertEquals(5, catalog.size())
        catalog.forEach { template ->
            val result = create("/api/collections/from-template", owner,
                """{"name":"Starter","templateId":"${template["id"].asString()}","language":"en"}""")
            val id = result["id"].asString()
            assertEquals("private", result["visibility"].asString())
            assertEquals("owner", result["currentUserRole"].asString())
            val notes = pins.findAllByCollectionIdOrderBySortOrder(id)
            assertEquals(template["sections"].size(), notes.size)
            assertTrue(notes.all { it.content!!.startsWith("Your first thought") })
            val elements = mapper.readTree(mvc.perform(get("/api/collections/$id/board-elements").session(sessionFor(owner)))
                .andExpect(status().isOk).andReturn().response.contentAsString)
            assertEquals(notes.size, elements["zones"].size())
            assertEquals(notes.size, elements["labels"].size())
            assertEquals(1, elements["stickers"].size())
        }
    }

    @Test
    fun `duplicating remaps stacks and connectors and preserves decorations without sharing or comments`() {
        val owner = user()
        val source = board(owner)
        val a = create("/api/collections/$source/pins", owner, """{"type":"note","data":{"title":"A","content":"Alpha","color":"white"},"tags":["idea"],"color":"sage"}""")
        val b = create("/api/collections/$source/pins", owner, """{"type":"note","data":{"content":"Beta"}}""")
        val aId = a["id"].asString()
        val bId = b["id"].asString()
        create("/api/collections/$source/pins/$aId/comments", owner, """{"body":"Do not copy discussion"}""")
        create("/api/collections/$source/board-elements/stacks", owner, """{"sourcePinId":"$aId","targetPinId":"$bId"}""")
        create("/api/collections/$source/board-elements/connectors", owner, """{"sourcePinId":"$aId","targetPinId":"$bId","colorVariant":"clay"}""")
        create("/api/collections/$source/board-elements/zones", owner, """{"x":0,"y":0,"widthClips":40,"heightClips":40,"colorVariant":"sage","label":"Zone"}""")
        create("/api/collections/$source/board-elements/labels", owner, """{"x":0,"y":40,"widthClips":4,"text":"Label","layer":4}""")
        create("/api/collections/$source/board-elements/stickers", owner, """{"x":40,"y":40,"motif":"star","colorVariant":"amber","rotation":12,"layer":5}""")
        val duplicated = create("/api/collections/$source/duplicate", owner, """{"name":"My copy"}""")
        val target = duplicated["id"].asString()
        val copies = pins.findAllByCollectionIdOrderBySortOrder(target)
        assertEquals(2, copies.size)
        assertTrue(copies.none { it.id == aId || it.id == bId })
        assertTrue(copies.all { it.createdBy!!.id == owner.id && it.comments.isEmpty() })
        assertEquals(setOf("idea"), copies.first().tags)
        assertEquals("sage", copies.first().color)
        assertEquals("private", duplicated["visibility"].asString())
        assertTrue(duplicated["inviteToken"].isNull)
        assertEquals(1, duplicated["members"].size())
        val elements = mapper.readTree(mvc.perform(get("/api/collections/$target/board-elements").session(sessionFor(owner)))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        val newIds = copies.map { it.id }.toSet()
        assertTrue(elements["stacks"][0]["children"].all { it.asString() in newIds })
        assertTrue(elements["connectors"][0]["sourcePinId"].asString() in newIds)
        assertEquals("Zone", elements["zones"][0]["label"].asString())
        assertEquals("Label", elements["labels"][0]["text"].asString())
        assertEquals(12.0, elements["stickers"][0]["rotation"].asDouble())
    }

    @Test
    fun `pin paste reauthorizes source and destination and keeps independent content without comments`() {
        val owner = user()
        val outsider = user()
        val source = board(owner)
        val target = board(owner)
        val pin = create("/api/collections/$source/pins", owner, """{"type":"note","data":{"content":"Original"},"tags":["source"]}""")
        val pinId = pin["id"].asString()
        val body = """{"sourceCollectionId":"$source","pinId":"$pinId"}"""
        val pasted = create("/api/collections/$target/pins/copy", owner, body)
        assertNotEquals(pinId, pasted["id"].asString())
        assertEquals("Original", pasted["data"]["content"].asString())
        assertEquals(0, pasted["comments"].size())
        mvc.perform(post("/api/collections/${board(outsider)}/pins/copy").session(sessionFor(outsider)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNotFound)
        val ownedByOther = board(outsider)
        mvc.perform(post("/api/collections/$ownedByOther/pins/copy").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isForbidden)
    }

    @Test
    fun `invalid templates and unauthorized duplication do not create partial boards`() {
        val owner = user()
        val source = board(owner)
        val outsider = user()
        mvc.perform(post("/api/collections/$source/duplicate").session(sessionFor(outsider)).contentType(MediaType.APPLICATION_JSON).content("""{"name":"Copy"}"""))
            .andExpect(status().isNotFound)
        mvc.perform(post("/api/collections/from-template").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"name":"Invalid","templateId":"unknown"}"""))
            .andExpect(status().isBadRequest)
        assertEquals(1, boards.findAllForUser(owner.id).filterNot { it.isSystem }.size)
        mvc.perform(post("/api/collections/$source/duplicate").contentType(MediaType.APPLICATION_JSON).content("""{"name":"Copy"}"""))
            .andExpect(status().isUnauthorized)
    }
}
