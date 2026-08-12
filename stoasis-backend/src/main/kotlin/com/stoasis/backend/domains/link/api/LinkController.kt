package com.stoasis.backend.domains.link.api

import com.stoasis.backend.domains.link.application.LinkPreviewService
import com.stoasis.backend.domains.link.data.LinkPreviewImageRepository
import com.stoasis.backend.shared.web.ApiException
import java.time.Duration
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/links")
class LinkController(
    private val previews: LinkPreviewService,
    private val images: LinkPreviewImageRepository,
    @Value("\${stoasis.public-api-base-url}") private val publicApiBaseUrl: String,
) {
    @GetMapping("/preview")
    fun preview(@RequestParam url: String) =
        previews.preview(url, publicApiBaseUrl.trimEnd('/'))

    @GetMapping("/previews/{id}")
    @Transactional(readOnly = true)
    fun previewImage(@PathVariable id: String): ResponseEntity<ByteArray> {
        val image = images.findById(id).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, "Vorschaubild nicht gefunden.")
        }
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePrivate())
            .header("X-Content-Type-Options", "nosniff")
            .header("Content-Security-Policy", "default-src 'none'; sandbox")
            .body(image.content)
    }
}
