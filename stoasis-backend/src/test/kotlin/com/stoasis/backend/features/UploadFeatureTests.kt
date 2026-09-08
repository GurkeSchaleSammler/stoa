package com.stoasis.backend.features

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.data.PinEntity
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post

/** Verifies decoded-image validation, trusted metadata and photo capacity. */
class UploadFeatureTests : FeatureTestSupport() {
    @Test
    fun `valid upload is resized and metadata cannot be forged by a pin`() {
        val owner = user()
        val auth = sessionFor(owner)
        val uploaded = mvc.post("/api/uploads") {
            this.session = auth
            contentType = MediaType.IMAGE_PNG
            content = png(2000, 1000)
            header("X-File-Name", "screenshot.png")
        }.andExpect {
            status { isCreated() }
            jsonPath("$.width", `is`(1600))
            jsonPath("$.height", `is`(800))
        }.andReturn()
        val key = json(uploaded.response.contentAsString).get("fileKey").asString()
        val id = board(owner)
        val created = mvc.post("/api/collections/$id/pins") {
            this.session = auth
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"photo","data":{"fileKey":"$key","width":1,"height":1,"imageUrl":"https://example.com/tracker"}}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.data.width", `is`(1600))
        }.andReturn()
        mvc.get("/api/uploads/$key") { this.session = auth }.andExpect {
            status { isOk() }
            header { string("X-Content-Type-Options", "nosniff") }
        }
        mvc.get("/api/uploads/$key").andExpect { status { isNotFound() } }
        mvc.get("/api/uploads/$key") { session = sessionFor(user()) }.andExpect { status { isNotFound() } }
        val pinId = json(created.response.contentAsString).get("id").asString()
        mvc.delete("/api/collections/$id/pins/$pinId") { session = auth }.andExpect { status { isNoContent() } }
        mvc.get("/api/uploads/$key") { session = auth }.andExpect { status { isNotFound() } }
    }

    @Test
    fun `invalid mismatched oversized and excessive dimension images are rejected`() {
        val auth = sessionFor(user())
        mvc.post("/api/uploads") {
            this.session = auth
            contentType = MediaType.IMAGE_PNG
            content = "<script>alert(1)</script>"
        }.andExpect { status { isUnsupportedMediaType() } }
        mvc.post("/api/uploads") {
            this.session = auth
            contentType = MediaType.IMAGE_JPEG
            content = png(10, 10)
        }.andExpect { status { isUnsupportedMediaType() } }
        mvc.post("/api/uploads") {
            this.session = auth
            contentType = MediaType.IMAGE_PNG
            content = ByteArray(5 * 1024 * 1024 + 1)
        }.andExpect { status { isContentTooLarge() } }
        mvc.post("/api/uploads") {
            this.session = auth
            contentType = MediaType.IMAGE_PNG
            content = png(12001, 1)
        }.andExpect { status { isBadRequest() } }
    }

    @Test
    fun `photo limit leaves notes and existing photo captions editable`() {
        val owner = user()
        val id = board(owner)
        val board = collections.get(id)
        repeat(50) { index ->
            pins.save(PinEntity(id = "quota-${owner.id}-$index", collection = board, type = PinType.photo, createdBy = owner, fileKey = "legacy", caption = "Existing"))
        }
        pins.flush()
        mvc.patch("/api/collections/$id/pins/quota-${owner.id}-0") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"data":{"caption":"Updated at the limit"}}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.data.caption", `is`("Updated at the limit"))
        }
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"photo","data":{"fileKey":"legacy"}}"""
        }.andExpect { status { isConflict() } }
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(owner)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"note","data":{"content":"Free notes"}}"""
        }.andExpect { status { isCreated() } }
    }

    @Test
    fun `an account cannot attach another users upload`() {
        val owner = user()
        val result = mvc.post("/api/uploads") {
            session = sessionFor(owner)
            contentType = MediaType.IMAGE_PNG
            content = png(2, 2)
        }.andReturn()
        val key = json(result.response.contentAsString).get("fileKey").asString()
        val other = user()
        val id = board(other)
        mvc.post("/api/collections/$id/pins") {
            session = sessionFor(other)
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"photo","data":{"fileKey":"$key"}}"""
        }.andExpect { status { isForbidden() } }
    }

    private fun png(width: Int, height: Int): ByteArray = ByteArrayOutputStream().also {
        ImageIO.write(BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", it)
    }.toByteArray()
}
