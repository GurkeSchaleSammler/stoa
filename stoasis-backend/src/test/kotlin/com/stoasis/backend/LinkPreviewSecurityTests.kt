package com.stoasis.backend

import com.stoasis.backend.domains.link.application.PreviewImageRenderer
import com.stoasis.backend.shared.utils.PublicUrlPolicy
import com.stoasis.backend.shared.web.ApiException
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.net.InetAddress
import javax.imageio.ImageIO
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class LinkPreviewSecurityTests {
    @Test
    fun `private loopback and metadata addresses are rejected`() {
        listOf(
            "127.0.0.1",
            "10.0.0.4",
            "169.254.169.254",
            "::1",
            "fc00::1",
            "64:ff9b::7f00:1",
            "2001:db8::1",
            "2002:7f00:1::",
        ).forEach { raw ->
            assertFalse(PublicUrlPolicy.isPublic(InetAddress.getByName(raw)), raw)
        }
    }

    @Test
    fun `non HTTP protocols and embedded credentials are rejected`() {
        assertFailsWith<ApiException> { PublicUrlPolicy.parse("file:///etc/passwd") }
        assertFailsWith<ApiException> { PublicUrlPolicy.parse("https://user:secret@example.com/") }
        assertFailsWith<ApiException> { PublicUrlPolicy.parse("http://example.com:8080/") }
        assertFailsWith<ApiException> { PublicUrlPolicy.parse("http://example.com:443/") }
        assertFailsWith<ApiException> { PublicUrlPolicy.parse("https://example.com:80/") }
    }

    @Test
    fun `remote image is decoded and re-encoded as a static JPEG`() {
        val source = BufferedImage(40, 30, BufferedImage.TYPE_INT_ARGB).apply {
            createGraphics().apply {
                color = Color.MAGENTA
                fillRect(0, 0, width, height)
                dispose()
            }
        }
        val input = ByteArrayOutputStream().also { ImageIO.write(source, "png", it) }.toByteArray()

        val rendered = PreviewImageRenderer().sanitizeRemoteImage(input)

        assertEquals(1_200, rendered.width)
        assertEquals(630, rendered.height)
        assertTrue(rendered.content[0] == 0xff.toByte() && rendered.content[1] == 0xd8.toByte())
    }
}
