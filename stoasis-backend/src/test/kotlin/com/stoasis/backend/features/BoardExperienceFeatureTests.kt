package com.stoasis.backend.features

import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.collection.model.Role
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.JsonNode

class BoardExperienceFeatureTests : FeatureTestSupport() {
    private fun create(url: String, user: UserEntity, body: String): JsonNode = json(mvc.perform(post(url)
        .session(sessionFor(user)).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated).andReturn().response.contentAsString)
    private fun pin(board: String, user: UserEntity) = create("/api/collections/$board/pins", user,
        """{"type":"note","data":{"content":"A station"}}""")["id"].asString()
    private fun experience(board: String, user: UserEntity) = json(mvc.perform(get("/api/collections/$board/experience")
        .session(sessionFor(user))).andExpect(status().isOk).andReturn().response.contentAsString)
    private fun pathBody(vararg ids: String) = mapper.writeValueAsString(mapOf("name" to "Tour", "pinIds" to ids.toList()))

    @Test
    fun `free labels stop at ten while plain connections editing and removal remain available`() {
        val owner = user(); val board = board(owner)
        val source = pin(board, owner)
        val targets = (0..11).map { pin(board, owner) }
        val url = "/api/collections/$board/board-elements/connectors"
        val connectors = targets.take(10).map { create(url, owner, """{"sourcePinId":"$source","targetPinId":"$it","label":"relates to"}""") }
        mvc.perform(post(url).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON)
            .content("""{"sourcePinId":"$source","targetPinId":"${targets[10]}","label":"eleven"}"""))
            .andExpect(status().isConflict)
        val plain = create(url, owner, """{"sourcePinId":"$source","targetPinId":"${targets[10]}"}""")
        mvc.perform(patch("$url/${plain["id"].asString()}").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"label":"eleven"}"""))
            .andExpect(status().isConflict)
        val first = connectors.first()["id"].asString()
        mvc.perform(patch("$url/$first").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"label":"updated"}"""))
            .andExpect(status().isOk)
        val colored = json(mvc.perform(patch("$url/$first").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"colorVariant":"sage"}"""))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        assertEquals("updated", colored["label"].asString())
        mvc.perform(patch("$url/$first").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"label":"   "}"""))
            .andExpect(status().isOk)
        create(url, owner, """{"sourcePinId":"$source","targetPinId":"${targets[11]}","label":"new capacity"}""")
        assertEquals(10, experience(board, owner)["connectorLabelLimit"].asInt())
    }

    @Test
    fun `seven free paths have unlimited steps can be reordered and capacity is released on deletion`() {
        val owner = user(); val board = board(owner); val a = pin(board, owner); val b = pin(board, owner)
        val url = "/api/collections/$board/experience/paths"
        val body = pathBody(*Array(20) { if (it % 2 == 0) a else b })
        val paths = (1..7).map { create(url, owner, body) }
        assertEquals(20, paths[0]["pinIds"].size())
        val error = json(mvc.perform(post(url).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict).andReturn().response.contentAsString)
        assertEquals("board.presentation_path_limit", error["code"].asString())
        val id = paths.first()["id"].asString()
        val updated = json(mvc.perform(put("$url/$id").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content(pathBody(b, a, b)))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        assertEquals(listOf(b, a, b), updated["pinIds"].toList().map { it.asString() })
        mvc.perform(delete("$url/$id").session(sessionFor(owner))).andExpect(status().isNoContent)
        create(url, owner, body)
        assertEquals(7, experience(board, owner)["paths"].size())
    }

    @Test
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    fun `premium exceeds both free limits and downgrade preserves existing content`() {
        val owner = user("premium"); val board = board(owner); val source = pin(board, owner)
        val url = "/api/collections/$board/experience/paths"
        repeat(12) {
            val target = pin(board, owner)
            create("/api/collections/$board/board-elements/connectors", owner, """{"sourcePinId":"$source","targetPinId":"$target","label":"connect"}""")
            create(url, owner, pathBody(source, target))
        }
        assertTrue(experience(board, owner)["presentationPathLimit"].isNull)
        owner.plan = "free"; users.saveAndFlush(owner)
        assertEquals(12, experience(board, owner)["paths"].size())
        val ownedBefore = boards.findAllForUser(owner.id).size
        mvc.perform(post("/api/collections/$board/duplicate").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON)
            .content("""{"name":"Cannot bypass capacity"}""")).andExpect(status().isConflict)
        assertEquals(ownedBefore, boards.findAllForUser(owner.id).size)
        mvc.perform(post(url).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content(pathBody(source))).andExpect(status().isConflict)
    }

    @Test
    fun `dates and paths enforce board ownership role validation and relational cleanup`() {
        val owner = user(); val board = board(owner); val a = pin(board, owner); val b = pin(board, owner)
        val outsider = user(); val otherBoard = board(outsider); val foreignPin = pin(otherBoard, outsider)
        val dateUrl = "/api/collections/$board/experience/dates/$a"
        mvc.perform(get("/api/collections/$board/experience").session(sessionFor(outsider))).andExpect(status().isForbidden)
        mvc.perform(put(dateUrl).session(sessionFor(outsider)).contentType(MediaType.APPLICATION_JSON).content("""{"startDate":"2026-10-01"}"""))
            .andExpect(status().isForbidden)
        mvc.perform(put(dateUrl).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"startDate":"2026-10-13","endDate":"2026-10-01"}"""))
            .andExpect(status().isBadRequest)
        mvc.perform(put(dateUrl).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"startDate":"2026-02-30"}"""))
            .andExpect(status().isBadRequest)
        mvc.perform(put(dateUrl).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"startDate":"2026-10-01","endDate":"2026-10-13"}"""))
            .andExpect(status().isNoContent)
        mvc.perform(post("/api/collections/$board/experience/paths").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content(pathBody(foreignPin)))
            .andExpect(status().isNotFound)
        mvc.perform(post("/api/collections/$board/experience/paths").session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"name":" ","pinIds":[]}"""))
            .andExpect(status().isBadRequest)
        val path = create("/api/collections/$board/experience/paths", owner, pathBody(a, b, a))
        create("/api/collections/$board/board-elements/connectors", owner, """{"sourcePinId":"$a","targetPinId":"$b","label":"stops at"}""")
        val copy = create("/api/collections/$board/duplicate", owner, """{"name":"Copied tour"}""")
        val copiedElements = json(mvc.perform(get("/api/collections/${copy["id"].asString()}/board-elements").session(sessionFor(owner)))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        assertEquals("stops at", copiedElements["connectors"][0]["label"].asString())
        val copied = experience(copy["id"].asString(), owner)
        assertEquals(1, copied["paths"].size()); assertEquals(1, copied["dates"].size())
        assertNotEquals(a, copied["paths"][0]["pinIds"][0].asString())
        assertEquals(copied["dates"][0]["pinId"].asString(), copied["paths"][0]["pinIds"][0].asString())
        val exported = json(mvc.perform(get("/api/profile/export").session(sessionFor(owner)))
            .andExpect(status().isOk).andReturn().response.contentAsString)
        val exportedBoard = exported["collections"].toList().first { it["id"].asString() == board }
        assertEquals(1, exportedBoard["experience"]["paths"].size())
        assertEquals(1, exportedBoard["experience"]["dates"].size())
        mvc.perform(delete("/api/collections/$board/pins/$a").session(sessionFor(owner))).andExpect(status().isNoContent)
        // The outer test transaction must flush the JPA deletion before the JDBC projection.
        pins.flush()
        val after = experience(board, owner)
        assertEquals(0, after["dates"].size())
        assertEquals(listOf(b), after["paths"][0]["pinIds"].toList().map { it.asString() })
        mvc.perform(put("/api/collections/$otherBoard/experience/paths/${path["id"].asString()}").session(sessionFor(outsider))
            .contentType(MediaType.APPLICATION_JSON).content(pathBody(foreignPin))).andExpect(status().isNotFound)
    }

    @Test
    fun `date removal and viewer read access work without edit access`() {
        val owner = user(); val boardId = board(owner); val a = pin(boardId, owner)
        val viewer = user()
        val entity = collections.get(boardId)
        entity.members.add(com.stoasis.backend.domains.collection.data.CollectionMemberEntity(collection = entity, user = viewer, role = Role.viewer))
        boards.saveAndFlush(entity)
        val dateUrl = "/api/collections/$boardId/experience/dates/$a"
        mvc.perform(put(dateUrl).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("""{"startDate":"2026-10-13"}"""))
            .andExpect(status().isNoContent)
        assertEquals(1, experience(boardId, viewer)["dates"].size())
        mvc.perform(put(dateUrl).session(sessionFor(viewer)).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden)
        mvc.perform(put(dateUrl).session(sessionFor(owner)).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isNoContent)
        assertEquals(0, experience(boardId, owner)["dates"].size())
    }
}
