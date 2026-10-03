package com.stoasis.backend.domains.upload.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.domains.upload.api.UploadResponse
import com.stoasis.backend.domains.upload.data.UploadEntity
import com.stoasis.backend.domains.upload.data.UploadRepository
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import java.io.InputStream
import java.time.Instant
import java.time.temporal.ChronoUnit
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Validates uploads, stores preview variants and authorizes image access. */
@Service
class UploadService(
    private val uploads: UploadRepository,
    private val users: UserRepository,
    private val pins: PinRepository,
    private val plans: PlanService,
    private val images: ImagePreviews,
    private val storage: UploadStorage,
    private val limiter: UploadRateLimiter,
    @Value("\${stoasis.public-api-base-url}") private val publicApiBaseUrl: String,
    private val idGenerator: IdGenerator,
) {
    @Transactional
    fun upload(userId: String, input: InputStream, contentType: String, originalName: String?): UploadResponse {
        limiter.check(userId)
        val user = plans.lock(userId)
        val limits = plans.limits(userId)
        if (uploads.countByOwnerId(userId) >= limits.photos + 10) {
            uploads.findKeysBefore(userId, Instant.now().minus(1, ChronoUnit.DAYS)).forEach(::discardUnused)
        }
        if (uploads.countByOwnerId(userId) >= limits.photos + 10) {
            throw ApiException(HttpStatus.CONFLICT, "Upload-Speicher voll. Entferne ungenutzte Bilder.")
        }
        val content = input.readNBytes(limits.imageBytes + 1)
        if (content.isEmpty()) throw ApiException(HttpStatus.BAD_REQUEST, "Keine Bilddatei empfangen.")
        if (content.size > limits.imageBytes) throw ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Bild überschreitet das Dateilimit (${limits.imageBytes / 1024 / 1024} MB).")
        val image = images.decode(content, contentType.substringBefore(';'))
        val preview = images.encode(image, limits.previewDimension, limits.premium)
        val thumbnail = images.encode(image, 480, false)
        val id = "upload-${idGenerator.newId()}"
        val upload = uploads.save(UploadEntity(
            id = id, owner = user, originalName = cleanName(originalName),
            contentType = preview.mimeType, imageWidth = preview.width, imageHeight = preview.height,
            content = storage.write(id, preview.content), thumbnail = storage.write("$id-thumb", thumbnail.content),
        ))
        return UploadResponse(id, url(id), upload.imageWidth, upload.imageHeight, upload.originalName, preview.mimeType, "${url(id)}?thumbnail=true")
    }

    @Transactional(readOnly = true)
    fun download(key: String, userId: String?, token: String?, thumbnail: Boolean): Pair<String, ByteArray> {
        val upload = uploads.findById(key).orElseThrow { ApiException(HttpStatus.NOT_FOUND, "Bild nicht gefunden.") }
        if (!canView(upload, userId, token)) throw ApiException(HttpStatus.NOT_FOUND, "Bild nicht gefunden.")
        val content = if (thumbnail && upload.thumbnail != null) {
            storage.read("$key-thumb", upload.thumbnail!!)
        } else storage.read(key, upload.content)
        return upload.contentType to content
    }

    @Transactional
    fun discard(key: String, userId: String) {
        val upload = uploads.findById(key).orElse(null) ?: return
        if (upload.owner?.id != userId) throw ApiException(HttpStatus.FORBIDDEN, "Kein Zugriff.")
        discardUnused(key)
    }

    @Transactional
    fun discardUnused(key: String) {
        val upload = uploads.findById(key).orElse(null) ?: return
        if (pins.findAllByFileKey(key).isNotEmpty() || users.existsByAvatarUrl(url(key))) return
        uploads.delete(upload)
        storage.deleteAfterCommit(key)
    }

    private fun canView(upload: UploadEntity, userId: String?, token: String?): Boolean {
        if (upload.owner?.id == userId || users.existsByAvatarUrl(url(upload.id))) return true
        return pins.findAllByFileKey(upload.id).any { pin ->
            val board = pin.collection!!
            board.visibility == Visibility.public || board.members.any { it.user?.id == userId } ||
                (board.visibility == Visibility.link && token != null && token == board.inviteToken)
        }
    }

    private fun cleanName(name: String?) = name.orEmpty().substringAfterLast('/').substringAfterLast('\\')
        .filterNot(Char::isISOControl).take(512).ifBlank { "Foto" }

    private fun url(key: String) = "${publicApiBaseUrl.trimEnd('/')}/api/uploads/$key"
}
