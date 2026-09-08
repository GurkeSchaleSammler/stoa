package com.stoasis.backend.domains.upload.application

import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.upload.data.UploadRepository
import com.stoasis.backend.shared.web.ApiException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import tools.jackson.databind.JsonNode

/** Binds photo pins to owned uploads and uses trusted image metadata. */
@Service
class PhotoPinService(
    private val uploads: UploadRepository,
    @Value("\${stoasis.public-api-base-url}") private val publicApiBaseUrl: String,
) {
    fun apply(pin: PinEntity, data: JsonNode, userId: String) {
        if (data.has("caption")) {
            val caption = data.get("caption").takeUnless { it.isNull }?.asString()?.trim()
            if (caption != null && caption.length > 2000) throw ApiException(HttpStatus.BAD_REQUEST, "Bildtext zu lang.")
            pin.caption = caption
        }
        val key = data.get("fileKey")?.asString() ?: pin.fileKey
        if (key.isNullOrBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "Foto fehlt.")
        if (pin.fileKey == key) return
        val upload = uploads.findById(key).orElseThrow { ApiException(HttpStatus.BAD_REQUEST, "Upload nicht gefunden.") }
        if (upload.owner?.id != userId) throw ApiException(HttpStatus.FORBIDDEN, "Dieser Upload gehört einem anderen Nutzer.")
        pin.fileKey = upload.id
        pin.imageWidth = upload.imageWidth
        pin.imageHeight = upload.imageHeight
        pin.imageUrl = "${publicApiBaseUrl.trimEnd('/')}/api/uploads/${upload.id}"
    }
}
