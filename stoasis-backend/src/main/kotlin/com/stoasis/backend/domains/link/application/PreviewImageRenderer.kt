package com.stoasis.backend.domains.link.application

import com.stoasis.backend.shared.web.ApiException
import java.awt.Color
import java.awt.Font
import java.awt.Graphics2D
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.IIOImage
import javax.imageio.ImageIO
import javax.imageio.ImageWriteParam
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

data class RenderedPreview(val content: ByteArray, val width: Int, val height: Int)

@Component
class PreviewImageRenderer {
    fun sanitizeRemoteImage(content: ByteArray): RenderedPreview {
        val input = ImageIO.createImageInputStream(ByteArrayInputStream(content))
            ?: throw invalidImage()
        try {
            val reader = ImageIO.getImageReaders(input).asSequence().firstOrNull() ?: throw invalidImage()
            try {
                reader.setInput(input, true, true)
                if (reader.formatName.lowercase() !in setOf("jpeg", "jpg", "png")) throw invalidImage()
                val width = reader.getWidth(0)
                val height = reader.getHeight(0)
                if (width !in 1..MAX_SOURCE_EDGE || height !in 1..MAX_SOURCE_EDGE ||
                    width.toLong() * height > MAX_SOURCE_PIXELS
                ) throw invalidImage()
                return encodeCover(reader.read(0))
            } finally {
                reader.dispose()
            }
        } finally {
            input.close()
        }
    }

    fun renderMetadata(siteName: String, title: String, description: String?): RenderedPreview {
        val image = BufferedImage(TARGET_WIDTH, TARGET_HEIGHT, BufferedImage.TYPE_INT_RGB)
        val hue = ((siteName.hashCode().toLong() and 0xffff) / 65535f)
        val background = Color.getHSBColor(hue, 0.34f, 0.19f)
        val accent = Color.getHSBColor(hue, 0.42f, 0.78f)
        val graphics = image.createGraphics()
        try {
            configure(graphics)
            graphics.color = background
            graphics.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)
            graphics.color = Color(255, 255, 255, 18)
            for (x in 0 until TARGET_WIDTH step 36) graphics.drawLine(x, 0, x, TARGET_HEIGHT)
            for (y in 0 until TARGET_HEIGHT step 36) graphics.drawLine(0, y, TARGET_WIDTH, y)
            graphics.color = accent
            graphics.fillRoundRect(64, 60, 70, 10, 10, 10)
            graphics.font = Font(Font.SANS_SERIF, Font.BOLD, 25)
            graphics.drawString(siteName.take(54), 64, 128)
            graphics.color = Color(247, 244, 236)
            graphics.font = Font(Font.SERIF, Font.BOLD, 52)
            var y = 208
            wrap(title, 34).take(3).forEach {
                graphics.drawString(it, 64, y)
                y += 62
            }
            description?.takeIf(String::isNotBlank)?.let {
                graphics.color = Color(220, 218, 210)
                graphics.font = Font(Font.SANS_SERIF, Font.PLAIN, 24)
                y += 18
                wrap(it, 70).take(3).forEach { line ->
                    graphics.drawString(line, 64, y)
                    y += 34
                }
            }
            graphics.color = accent
            graphics.fillOval(TARGET_WIDTH - 118, TARGET_HEIGHT - 118, 54, 54)
        } finally {
            graphics.dispose()
        }
        return encodeJpeg(image)
    }

    private fun encodeCover(source: BufferedImage): RenderedPreview {
        val output = BufferedImage(TARGET_WIDTH, TARGET_HEIGHT, BufferedImage.TYPE_INT_RGB)
        val graphics = output.createGraphics()
        try {
            configure(graphics)
            graphics.color = Color(23, 24, 21)
            graphics.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)
            val scale = maxOf(TARGET_WIDTH.toDouble() / source.width, TARGET_HEIGHT.toDouble() / source.height)
            val width = (source.width * scale).toInt()
            val height = (source.height * scale).toInt()
            graphics.drawImage(source, (TARGET_WIDTH - width) / 2, (TARGET_HEIGHT - height) / 2, width, height, null)
        } finally {
            graphics.dispose()
        }
        return encodeJpeg(output)
    }

    private fun encodeJpeg(image: BufferedImage): RenderedPreview {
        val output = ByteArrayOutputStream()
        val writer = ImageIO.getImageWritersByFormatName("jpeg").next()
        try {
            ImageIO.createImageOutputStream(output).use { imageOutput ->
                writer.output = imageOutput
                val params = writer.defaultWriteParam.apply {
                    compressionMode = ImageWriteParam.MODE_EXPLICIT
                    compressionQuality = 0.84f
                }
                writer.write(null, IIOImage(image, null, null), params)
            }
        } finally {
            writer.dispose()
        }
        return RenderedPreview(output.toByteArray(), image.width, image.height)
    }

    private fun configure(graphics: Graphics2D) {
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
    }

    private fun wrap(value: String, maxCharacters: Int): List<String> {
        val lines = mutableListOf<String>()
        var current = StringBuilder()
        value.trim().split(Regex("\\s+")).forEach { word ->
            if (current.isNotEmpty() && current.length + word.length + 1 > maxCharacters) {
                lines += current.toString()
                current = StringBuilder()
            }
            if (current.isNotEmpty()) current.append(' ')
            current.append(word.take(maxCharacters))
        }
        if (current.isNotEmpty()) lines += current.toString()
        return lines
    }

    private fun invalidImage() =
        ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Das Vorschaubild ist kein sicheres Rasterbild.")

    companion object {
        private const val TARGET_WIDTH = 1_200
        private const val TARGET_HEIGHT = 630
        private const val MAX_SOURCE_EDGE = 6_000
        private const val MAX_SOURCE_PIXELS = 20_000_000L
    }
}
