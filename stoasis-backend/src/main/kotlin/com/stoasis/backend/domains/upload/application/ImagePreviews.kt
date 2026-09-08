package com.stoasis.backend.domains.upload.application

import com.stoasis.backend.shared.web.ApiException
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import javax.imageio.stream.MemoryCacheImageInputStream
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

/** Decodes bounded images and strips metadata by encoding safe previews. */
@Component
class ImagePreviews {
    fun decode(content: ByteArray, contentType: String): BufferedImage {
        try {
            MemoryCacheImageInputStream(ByteArrayInputStream(content)).use { input ->
                val reader = ImageIO.getImageReaders(input).asSequence().firstOrNull() ?: invalid()
                try {
                    reader.input = input
                    val mime = when (reader.formatName.lowercase()) {
                        "jpeg", "jpg" -> "image/jpeg"
                        "png" -> "image/png"
                        "webp" -> "image/webp"
                        else -> invalid()
                    }
                    if (mime != contentType) invalid()
                    validateDimensions(reader.getWidth(0), reader.getHeight(0))
                    return reader.read(0) ?: invalid()
                } finally {
                    reader.dispose()
                }
            }
        } catch (error: ApiException) {
            throw error
        } catch (_: Exception) {
            invalid()
        }
    }

    fun encode(image: BufferedImage, maximum: Int, premium: Boolean): EncodedPreview {
        val resized = resize(image, maximum)
        val mime = if (resized.colorModel.hasAlpha()) "image/png" else "image/jpeg"
        val output = ByteArrayOutputStream()
        val writer = ImageIO.getImageWritersByMIMEType(mime).next()
        try {
            ImageIO.createImageOutputStream(output).use { stream ->
                writer.output = stream
                val parameters = writer.defaultWriteParam
                if (mime == "image/jpeg") {
                    parameters.compressionMode = javax.imageio.ImageWriteParam.MODE_EXPLICIT
                    parameters.compressionQuality = if (premium) 0.9f else 0.75f
                }
                writer.write(null, javax.imageio.IIOImage(resized, null, null), parameters)
            }
        } finally {
            writer.dispose()
        }
        return EncodedPreview(output.toByteArray(), mime, resized.width, resized.height)
    }

    private fun resize(image: BufferedImage, maximum: Int): BufferedImage {
        val scale = minOf(1.0, maximum.toDouble() / maxOf(image.width, image.height))
        val type = if (image.colorModel.hasAlpha()) BufferedImage.TYPE_INT_ARGB else BufferedImage.TYPE_INT_RGB
        val result = BufferedImage(maxOf(1, (image.width * scale).toInt()), maxOf(1, (image.height * scale).toInt()), type)
        val graphics = result.createGraphics()
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
            graphics.drawImage(image, 0, 0, result.width, result.height, null)
        } finally {
            graphics.dispose()
        }
        return result
    }

    private fun validateDimensions(width: Int, height: Int) {
        if (width !in 1..12000 || height !in 1..12000 || width.toLong() * height > 40_000_000) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Bild zu gross: höchstens 12.000 Pixel pro Seite und 40 Megapixel.")
        }
    }

    private fun invalid(): Nothing = throw ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Ungültiges Bild. JPEG, PNG oder WebP erforderlich.")
}

/** Contains a sanitized image variant and its measured dimensions. */
data class EncodedPreview(val content: ByteArray, val mimeType: String, val width: Int, val height: Int)
