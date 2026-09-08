package com.stoasis.backend.domains.profile.application

import com.stoasis.backend.domains.search.application.SearchDiscoveryService
import com.stoasis.backend.domains.search.data.TagRepository
import com.stoasis.backend.domains.upload.application.UploadStorage
import com.stoasis.backend.domains.upload.data.UploadRepository
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

/** Adds owned images, tags and saved filters to a bounded account archive. */
@Service
class ProfileArchiveService(
    private val uploads: UploadRepository,
    private val storage: UploadStorage,
    private val tags: TagRepository,
    private val discovery: SearchDiscoveryService,
) {
    fun data(userId: String): Map<String, Any> {
        var total = 0L
        val images = uploads.findAllByOwnerId(userId).map { upload ->
            val content = storage.read(upload.id, upload.content)
            total += content.size
            if (total > 64 * 1024 * 1024) throw ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Das Kontoarchiv überschreitet 64 MB. Exportiere deine Boards und lade Bilder einzeln herunter.")
            mapOf("fileKey" to upload.id, "name" to upload.originalName, "mimeType" to upload.contentType,
                "width" to upload.imageWidth, "height" to upload.imageHeight,
                "contentBase64" to java.util.Base64.getEncoder().encodeToString(content))
        }
        return mapOf("uploads" to images, "tags" to tags.findAllByOwnerIdOrderByName(userId).map { it.name }, "savedSearches" to discovery.list(userId))
    }
}
