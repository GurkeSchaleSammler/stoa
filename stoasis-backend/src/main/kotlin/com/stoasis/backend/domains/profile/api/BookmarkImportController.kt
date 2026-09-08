package com.stoasis.backend.domains.profile.api

import com.stoasis.backend.domains.profile.application.BookmarkImportService
import com.stoasis.backend.shared.security.CurrentUser
import com.stoasis.backend.shared.web.ApiException
import jakarta.servlet.http.HttpServletRequest
import java.security.MessageDigest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/** Requires confirmation of the same file and destination that were previewed. */
@RestController
@RequestMapping("/api/profile/import/pocket")
class BookmarkImportController(private val imports: BookmarkImportService, private val currentUser: CurrentUser) {
    @PostMapping("/preview", consumes = ["text/csv"])
    fun preview(@RequestParam collectionId: String, request: HttpServletRequest): ImportResult {
        val content = read(request)
        val report = imports.preview(currentUser.id(), collectionId, content)
        request.session.setAttribute("stoasis.import-preview", fingerprint(collectionId, content))
        return report
    }

    @PostMapping(consumes = ["text/csv"])
    fun import(@RequestParam collectionId: String, request: HttpServletRequest): ImportResult {
        val content = read(request)
        if (request.session.getAttribute("stoasis.import-preview") != fingerprint(collectionId, content)) {
            throw ApiException(HttpStatus.CONFLICT, "Bitte zuerst diese Datei und das Ziel-Board in der Vorschau prüfen.")
        }
        val result = imports.import(currentUser.id(), collectionId, content)
        request.session.removeAttribute("stoasis.import-preview")
        return result
    }

    private fun read(request: HttpServletRequest): ByteArray {
        val content = request.inputStream.readNBytes(10 * 1024 * 1024 + 1)
        if (content.isEmpty() || content.size > 10 * 1024 * 1024) {
            throw ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "CSV-Dateien müssen zwischen 1 Byte und 10 MB gross sein.")
        }
        return content
    }

    private fun fingerprint(board: String, content: ByteArray): String = board + ":" +
        java.util.Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(content))
}
