package com.stoasis.backend.domains.upload.api

import com.stoasis.backend.domains.upload.application.UploadService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.CacheControl
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

/** Accepts bounded image streams and serves authorized previews with safe headers. */
@RestController
@RequestMapping("/api/uploads")
class UploadController(private val uploads: UploadService, private val currentUser: CurrentUser) {
    @PostMapping(consumes = ["image/jpeg", "image/png", "image/webp"])
    @ResponseStatus(HttpStatus.CREATED)
    fun upload(request: HttpServletRequest, @RequestHeader("X-File-Name", required = false) name: String?) =
        uploads.upload(currentUser.id(), request.inputStream, request.contentType, name)

    @DeleteMapping("/{fileKey}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun discard(@PathVariable fileKey: String) = uploads.discard(fileKey, currentUser.id())

    @GetMapping("/{fileKey}")
    fun download(
        @PathVariable fileKey: String,
        @RequestParam(required = false) token: String?,
        @RequestParam(defaultValue = "false") thumbnail: Boolean,
    ): ResponseEntity<ByteArray> {
        val (mime, content) = uploads.download(fileKey, currentUser.idOrNull(), token, thumbnail)
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(mime))
            .cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options", "nosniff")
            .header("Content-Security-Policy", "default-src 'none'; sandbox")
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
            .body(content)
    }
}
