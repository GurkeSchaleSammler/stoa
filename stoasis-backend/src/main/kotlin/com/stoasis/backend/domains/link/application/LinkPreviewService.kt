package com.stoasis.backend.domains.link.application

import com.stoasis.backend.domains.link.data.LinkPreviewImageEntity
import com.stoasis.backend.domains.link.data.LinkPreviewImageRepository
import com.stoasis.backend.domains.pin.api.LinkPinData
import com.stoasis.backend.shared.security.PublicUrlPolicy
import com.stoasis.backend.shared.security.SafeHttpFetcher
import com.stoasis.backend.shared.web.ApiException
import java.io.ByteArrayInputStream
import java.net.URI
import java.security.MessageDigest
import java.time.Instant
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

@Service
class LinkPreviewService(
    private val fetcher: SafeHttpFetcher,
    private val images: LinkPreviewImageRepository,
    private val renderer: PreviewImageRenderer,
) {
    fun preview(rawUrl: String, backendBaseUrl: String): LinkPinData {
        val uri = PublicUrlPolicy.parse(rawUrl)
        val response = fetcher.get(uri, "text/html,application/xhtml+xml;q=0.9", MAX_HTML_BYTES)
        if (response.status !in 200..299) {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Die Seite lieferte HTTP ${response.status}.")
        }
        val contentType = response.headers["content-type"]?.substringBefore(';')?.lowercase()
        if (contentType !in setOf("text/html", "application/xhtml+xml")) {
            throw ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Die URL verweist nicht auf eine HTML-Seite.")
        }
        val document = Jsoup.parse(ByteArrayInputStream(response.body), null, response.uri.toString())
        val host = response.uri.host.removePrefix("www.")
        val title = metadata(document, "og:title", "twitter:title")
            ?: document.title().trim().takeIf(String::isNotBlank)
            ?: "Inhalt von $host"
        val description = metadata(document, "og:description", "twitter:description", "description")
        val siteName = metadata(document, "og:site_name") ?: host
        val previewSource = metadata(document, "og:image", "og:image:secure_url", "twitter:image")
            ?.let { runCatching { response.uri.resolve(it) }.getOrNull() }
        val rendered = previewSource?.let(::fetchRasterPreview)
            ?: renderer.renderMetadata(siteName, title, description)
        val previewId = fingerprint(response.uri, previewSource, rendered.content)
        images.save(
            LinkPreviewImageEntity(
                id = previewId,
                sourceUrl = (previewSource ?: response.uri).toString().take(4096),
                content = rendered.content,
                imageWidth = rendered.width,
                imageHeight = rendered.height,
                createdAt = Instant.now(),
            ),
        )
        val wordCount = document.body().text().split(Regex("\\s+")).count { it.isNotBlank() }
        return LinkPinData(
            url = response.uri.toString(),
            title = title.take(1_000),
            description = description?.take(2_000),
            imageUrl = "$backendBaseUrl/api/links/previews/$previewId",
            siteName = siteName.take(512),
            readingTimeMin = ((wordCount + 219) / 220).coerceIn(1, 60),
            parseStatus = if (previewSource == null) "metadata" else "ok",
        )
    }

    private fun fetchRasterPreview(uri: URI): RenderedPreview? = runCatching {
        PublicUrlPolicy.validate(uri)
        val response = fetcher.get(uri, "image/png,image/jpeg;q=0.9", MAX_IMAGE_BYTES)
        if (response.status !in 200..299) return@runCatching null
        val contentType = response.headers["content-type"]?.substringBefore(';')?.lowercase()
        if (contentType !in setOf("image/png", "image/jpeg", "image/jpg")) return@runCatching null
        renderer.sanitizeRemoteImage(response.body)
    }.getOrNull()

    private fun metadata(document: Document, vararg names: String): String? {
        names.forEach { name ->
            document.selectFirst("meta[property=\"$name\"], meta[name=\"$name\"]")
                ?.attr("content")
                ?.trim()
                ?.takeIf(String::isNotBlank)
                ?.let { return it }
        }
        return null
    }

    private fun fingerprint(page: URI, image: URI?, bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        digest.update(page.toString().toByteArray())
        digest.update(image?.toString()?.toByteArray() ?: byteArrayOf())
        digest.update(bytes)
        return digest.digest().joinToString("") { (it.toInt() and 0xff).toString(16).padStart(2, '0') }.take(40)
    }

    companion object {
        private const val MAX_HTML_BYTES = 1_048_576
        private const val MAX_IMAGE_BYTES = 5_242_880
    }
}
