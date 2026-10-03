package com.stoasis.backend

import com.stoasis.backend.domains.auth.data.UserRepository
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.`is`
import org.hamcrest.Matchers.nullValue
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.delete

@SpringBootTest
@AutoConfigureMockMvc
class StoasisBackendApplicationTests {
    @Autowired
    private lateinit var mvc: MockMvc

    @Autowired
    private lateinit var users: UserRepository

    @Test
    fun `validation errors expose stable field codes`() {
        mvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"invalid","name":"x","password":"short"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code", `is`("request.validation_failed"))
            jsonPath("$.fieldErrors.email", `is`("request.invalid_email"))
            jsonPath("$.fieldErrors.name", `is`("request.invalid_size"))
            jsonPath("$.fieldErrors.password", `is`("request.invalid_size"))
        }
    }

    @Test
    fun `protected API rejects requests without a session`() {
        mvc.get("/api/collections").andExpect {
            status { isUnauthorized() }
            jsonPath("$.message", `is`("Nicht angemeldet."))
            jsonPath("$.code", `is`("auth.required"))
        }
    }

    @Test
    fun `OpenAPI exposes the HTTP schema and session authentication contract`() {
        mvc.get("/v3/api-docs").andExpect {
            status { isOk() }
            jsonPath("$.info.title", `is`("Stoasis HTTP API"))
            jsonPath("$.components.securitySchemes.sessionCookie.name", `is`("stoasis_session"))
            jsonPath("$.paths['/api/collections'].get", notNullValue())
        }
    }

    @Test
    fun `local dump supports the frontend collection and pin flow`() {
        val login = mvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email":"du@stoa.test","password":"test1234"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.email", `is`("du@stoa.test"))
            jsonPath("$.user.plan", `is`("free"))
        }.andReturn()
        val session = login.request.getSession(false) as MockHttpSession

        mvc.get("/api/auth/me") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$.name", `is`("Du"))
        }
        mvc.get("/api/collections/coll-japan") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$.members", hasSize<Any>(3))
            jsonPath("$.currentUserRole", `is`("owner"))
        }
        mvc.get("/api/collections/coll-japan/pins") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(5))
            jsonPath("$[0].data.url", `is`("https://fly.io/blog/sqlite-internals/"))
        }
    }

    @Test
    fun `authenticated user can create update search and delete content`() {
        val session = loginSession()
        val collectionResponse = mvc.post("/api/collections") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Integration Test","emoji":"","allowedTypes":["note"]}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name", `is`("Integration Test"))
        }.andReturn()
        val collectionId = collectionResponse.response.contentAsString.field("id")

        val pinResponse = mvc.post("/api/collections/$collectionId/pins") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Backend Test","color":"white"},"color":"accent","tags":["kotlin"]}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.data.content", `is`("Backend Test"))
            jsonPath("$.color", `is`("accent"))
        }.andReturn()
        val pinId = pinResponse.response.contentAsString.field("id")

        mvc.patch("/api/collections/$collectionId/pins/$pinId") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"data":{"content":"Aktualisiert","color":"black"},"color":"amber"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.data.content", `is`("Aktualisiert"))
            jsonPath("$.data.color", `is`("black"))
            jsonPath("$.color", `is`("amber"))
        }
        mvc.patch("/api/collections/$collectionId/pins/$pinId") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"color":""}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.color", nullValue())
        }
        mvc.get("/api/search") {
            this.session = session
            param("q", "Aktualisiert")
        }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(1))
            jsonPath("$[0].collectionName", `is`("Integration Test"))
        }
        mvc.delete("/api/collections/$collectionId/pins/$pinId") { this.session = session }
            .andExpect { status { isNoContent() } }
        mvc.delete("/api/collections/$collectionId") { this.session = session }
            .andExpect { status { isNoContent() } }
    }

    @Test
    fun `custom pin and background colors require pro`() {
        val session = loginSession()
        mvc.post("/api/collections/coll-dev/pins") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Free custom background","color":"#F0E1D2"}}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.message", `is`("Eigene Farben sind nur mit Pro verfügbar."))
        }
        mvc.post("/api/collections/coll-dev/pins") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Free custom pin","color":"white"},"color":"#86A873"}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.message", `is`("Eigene Farben sind nur mit Pro verfügbar."))
        }

        val user = users.findByEmailIgnoreCase("du@stoa.test")!!
        user.plan = "premium"
        users.saveAndFlush(user)
        var pinId: String? = null
        try {
            val response = mvc.post("/api/collections/coll-dev/pins") {
                this.session = session
                contentType = MediaType.APPLICATION_JSON
                content = """{"type":"note","data":{"content":"Pro custom colour","color":"#F0E1D2"},"color":"#86A873"}"""
            }.andExpect {
                status { isCreated() }
                jsonPath("$.data.color", `is`("#f0e1d2"))
                jsonPath("$.color", `is`("#86a873"))
            }.andReturn()
            pinId = response.response.contentAsString.field("id")
        } finally {
            pinId?.let {
                mvc.delete("/api/collections/coll-dev/pins/$it") { this.session = session }
                    .andExpect { status { isNoContent() } }
            }
            user.plan = "free"
            users.saveAndFlush(user)
        }
    }

    @Test
    fun `clip position is persisted and excessive overlap is rejected`() {
        val session = loginSession()
        val collectionId = mvc.post("/api/collections") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Clip Grid Test","emoji":"◫","allowedTypes":["note"]}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn().response.contentAsString.field("id")

        val firstPinId = createNote(collectionId, session, "Erste Karte")
        val secondPinId = createNote(collectionId, session, "Zweite Karte")

        mvc.patch("/api/collections/$collectionId/pins/$firstPinId") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"grid":{"x":36,"y":40,"heightClips":12,"layer":7}}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.grid.x", `is`(36))
            jsonPath("$.grid.y", `is`(40))
            jsonPath("$.grid.width", `is`(16))
            jsonPath("$.grid.layer", `is`(7))
        }

        mvc.get("/api/collections/$collectionId/pins") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$[0].grid.x", `is`(36))
            jsonPath("$[0].grid.heightClips", `is`(12))
        }

        mvc.patch("/api/collections/$collectionId/pins/$secondPinId") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"grid":{"x":36,"y":40,"heightClips":12,"layer":8}}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.message", `is`("Karten dürfen sich höchstens zur Hälfte überlagern."))
        }

        mvc.delete("/api/collections/$collectionId") { this.session = session }
            .andExpect { status { isNoContent() } }
    }

    @Test
    fun `board decorations stacks and connectors are persisted`() {
        val session = loginSession()
        val collectionId = mvc.post("/api/collections") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Board Elements Test","emoji":"✦","allowedTypes":["note"]}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn().response.contentAsString.field("id")

        val firstPinId = createNote(collectionId, session, "Quelle")
        val secondPinId = createNote(collectionId, session, "Ziel")

        val connectorId = mvc.post("/api/collections/$collectionId/board-elements/connectors") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content =
                """{"sourcePinId":"$firstPinId","targetPinId":"$secondPinId","colorVariant":"#D94A4A"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.sourcePinId", `is`(firstPinId))
            jsonPath("$.targetPinId", `is`(secondPinId))
            jsonPath("$.colorVariant", `is`("#d94a4a"))
        }.andReturn().response.contentAsString.field("id")

        mvc.patch("/api/collections/$collectionId/board-elements/connectors/$connectorId") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"colorVariant":"86a873"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.colorVariant", `is`("#86a873"))
        }

        val stackId = mvc.post("/api/collections/$collectionId/board-elements/stacks") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"sourcePinId":"$firstPinId","targetPinId":"$secondPinId"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.children", hasSize<Any>(2))
        }.andReturn().response.contentAsString.field("id")

        mvc.patch("/api/collections/$collectionId/board-elements/stacks/$stackId") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"expanded":true}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.expanded", `is`(true))
        }

        mvc.post("/api/collections/$collectionId/board-elements/zones") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content =
                """{"x":48,"y":32,"widthClips":20,"heightClips":12,"colorVariant":"sage","label":"Ideen"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.label", `is`("Ideen"))
        }

        mvc.post("/api/collections/$collectionId/board-elements/labels") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"x":70,"y":30,"widthClips":4,"text":"Merker","layer":4}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.text", `is`("Merker"))
        }

        mvc.post("/api/collections/$collectionId/board-elements/stickers") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content =
                """{"motif":"star","colorVariant":"amber","x":980.5,"y":420.25,"widthClips":4.5,"heightClips":4.5,"rotation":-8.0,"layer":5}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.motif", `is`("star"))
            jsonPath("$.rotation", `is`(-8.0))
        }

        mvc.get("/api/collections/$collectionId/board-elements") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$.stacks", hasSize<Any>(1))
            jsonPath("$.stacks[0].expanded", `is`(true))
            jsonPath("$.connectors", hasSize<Any>(1))
            jsonPath("$.zones", hasSize<Any>(1))
            jsonPath("$.labels", hasSize<Any>(1))
            jsonPath("$.stickers", hasSize<Any>(1))
        }

        mvc.post("/api/collections/$collectionId/board-elements/stickers") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content =
                """{"motif":"star","colorVariant":"amber","x":100.0,"y":100.0,"widthClips":4.0,"heightClips":4.0,"rotation":16.0,"layer":6}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.message", `is`("Ungültige Sticker-Geometrie."))
        }

        mvc.delete("/api/collections/$collectionId") { this.session = session }
            .andExpect { status { isNoContent() } }
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    fun `profile skills are private by default and can be shared explicitly`() {
        val session = loginSession()
        val boards = mvc.get("/api/profile-boards") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(2))
            jsonPath("$[0].boardKind", `is`("WORK"))
            jsonPath("$[0].visibility", `is`("private"))
        }.andReturn()
        val workBoardId = boards.response.contentAsString.field("id")

        val skill = mvc.post("/api/profile-boards/WORK/skills") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"skillName":"Kotlin","level":"ADVANCED","yearsExperience":6}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.skills[0].skillName", `is`("Kotlin"))
            jsonPath("$.skills[0].level", `is`("ADVANCED"))
        }.andReturn()
        val skillId = skill.response.contentAsString.firstSkillId()

        mvc.patch("/api/profile-boards/WORK/skills/$skillId/grid") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"x":36,"y":40,"heightClips":12,"layer":7}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.skills[0].grid.x", `is`(36))
            jsonPath("$.skills[0].grid.y", `is`(40))
        }

        mvc.get("/api/public/profile-boards/$workBoardId").andExpect { status { isForbidden() } }

        val premiumUser = users.findByEmailIgnoreCase("du@stoa.test")!!
        premiumUser.plan = "premium"
        users.saveAndFlush(premiumUser)
        mvc.patch("/api/profile-boards/WORK/visibility") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"public"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.visibility", `is`("public"))
        }
        mvc.get("/api/public/profile-boards/$workBoardId").andExpect {
            status { isOk() }
            jsonPath("$.skills[0].skillName", `is`("Kotlin"))
            jsonPath("$.skills[0].grid.x", `is`(36))
        }

        mvc.delete("/api/collections/$workBoardId") { this.session = session }
            .andExpect { status { isConflict() } }
        mvc.delete("/api/profile-boards/WORK/skills/$skillId") { this.session = session }
            .andExpect { status { isOk() } }
        mvc.patch("/api/profile-boards/WORK/visibility") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"visibility":"private"}"""
        }.andExpect { status { isOk() } }
    }

    @Test
    fun `group skills require an explicit per-group sharing preference`() {
        val session = loginSession()
        val skill = mvc.post("/api/profile-boards/PERSONAL/skills") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"skillName":"Keramik","level":"INTERMEDIATE"}"""
        }.andExpect { status { isOk() } }.andReturn()
        val skillId = skill.response.contentAsString.firstSkillId()

        val group = mvc.post("/api/groups") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Skill Testgruppe"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.mySharingPreference", `is`("NONE"))
        }.andReturn()
        val groupId = group.response.contentAsString.field("id")
        val inviteToken = group.response.contentAsString.field("inviteToken")

        mvc.get("/api/groups/$groupId/skills") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$", hasSize<Any>(0))
        }
        mvc.patch("/api/groups/$groupId/sharing") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"sharingPreference":"PERSONAL_ONLY"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.mySharingPreference", `is`("PERSONAL_ONLY"))
        }
        mvc.get("/api/groups/$groupId/skills") { this.session = session }.andExpect {
            status { isOk() }
            jsonPath("$[0].skills[0].skillName", `is`("Keramik"))
            jsonPath("$[0].skills[0].boardKind", `is`("PERSONAL"))
        }

        val annaSession = loginSession("anna@stoa.test")
        mvc.post("/api/groups/join/$inviteToken") { this.session = annaSession }.andExpect {
            status { isOk() }
            jsonPath("$.groupId", `is`(groupId))
        }
        mvc.get("/api/groups/$groupId") { this.session = annaSession }.andExpect {
            status { isOk() }
            jsonPath("$.mySharingPreference", `is`("NONE"))
        }
        mvc.delete("/api/groups/$groupId/membership") { this.session = annaSession }
            .andExpect { status { isNoContent() } }

        mvc.delete("/api/groups/$groupId") { this.session = session }
            .andExpect { status { isNoContent() } }
        mvc.delete("/api/profile-boards/PERSONAL/skills/$skillId") { this.session = session }
            .andExpect { status { isOk() } }
    }

    private fun createNote(collectionId: String, session: MockHttpSession, contentValue: String): String =
        mvc.post("/api/collections/$collectionId/pins") {
            this.session = session
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"$contentValue","color":"white"}}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn().response.contentAsString.field("id")

    private fun loginSession(email: String = "du@stoa.test"): MockHttpSession = mvc.post("/api/auth/login") {
        contentType = MediaType.APPLICATION_JSON
        content = """{"email":"$email","password":"test1234"}"""
    }.andReturn().request.getSession(false) as MockHttpSession

    private fun String.field(name: String): String =
        Regex("\\\"$name\\\":\\\"([^\\\"]+)\\\"").find(this)?.groupValues?.get(1)
            ?: error("Feld $name fehlt in $this")

    private fun String.firstSkillId(): String =
        Regex("\\\"skills\\\":\\[\\{\\\"id\\\":\\\"([^\\\"]+)\\\"").find(this)?.groupValues?.get(1)
            ?: error("Skill-ID fehlt in $this")
}
