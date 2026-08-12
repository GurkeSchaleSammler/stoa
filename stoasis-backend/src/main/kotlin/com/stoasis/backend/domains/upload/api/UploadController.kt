package com.stoasis.backend.domains.upload.api

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.upload.data.UploadEntity
import com.stoasis.backend.domains.upload.data.UploadRepository
import com.stoasis.backend.shared.security.CurrentUser
import com.stoasis.backend.shared.web.ApiException
import jakarta.servlet.http.HttpServletRequest
import java.io.ByteArrayInputStream
import java.util.UUID
import javax.imageio.ImageIO
import org.springframework.http.CacheControl
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

data class UploadResponse(
    val fileKey: String,
    val imageUrl: String,
    val width: Int,
    val height: Int,
    val originalName: String,
)

@RestController
@RequestMapping("/api/uploads")
class UploadController(
    private val uploads: UploadRepository,
    private val users: UserRepository,
    private val currentUser: CurrentUser,
) {
    @PostMapping(consumes = ["image/jpeg", "image/png", "image/webp", "application/octet-stream"])
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    fun upload(
        @RequestBody content: ByteArray,
        @RequestHeader(HttpHeaders.CONTENT_TYPE, required = false) contentType: String?,
        @RequestHeader("X-File-Name", required = false) originalName: String?,
        request: HttpServletRequest,
    ): UploadResponse {
        if (content.isEmpty()) throw ApiException(HttpStatus.BAD_REQUEST, "Keine Bilddatei empfangen.")
        val mediaType = contentType?.substringBefore(';') ?: MediaType.APPLICATION_OCTET_STREAM_VALUE
        if (mediaType != MediaType.APPLICATION_OCTET_STREAM_VALUE && !mediaType.startsWith("image/")) {
            throw ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Nur Bilddateien sind erlaubt.")
        }
        val image = runCatching { ImageIO.read(ByteArrayInputStream(content)) }.getOrNull()
        val id = "upload-${UUID.randomUUID().toString().take(12)}"
        val entity = uploads.save(
            UploadEntity(
                id = id,
                owner = users.getReferenceById(currentUser.id()),
                originalName = originalName?.takeIf(String::isNotBlank) ?: "Foto",
                contentType = mediaType,
                content = content,
                imageWidth = image?.width ?: 1600,
                imageHeight = image?.height ?: 1000,
            ),
        )
        val baseUrl = "${request.scheme}://${request.serverName}:${request.serverPort}"
        return UploadResponse(entity.id, "$baseUrl/api/uploads/${entity.id}", entity.imageWidth, entity.imageHeight, entity.originalName)
    }

    @GetMapping("/{fileKey}")
    @Transactional(readOnly = true)
    fun download(@PathVariable fileKey: String): ResponseEntity<ByteArray> {
        val upload = uploads.findById(fileKey).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, "Bild nicht gefunden.")
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(upload.contentType))
            .cacheControl(CacheControl.noCache())
            .body(upload.content)
    }
}
