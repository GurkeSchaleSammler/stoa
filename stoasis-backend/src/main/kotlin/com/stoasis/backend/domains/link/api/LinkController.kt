package com.stoasis.backend.domains.link.api

import com.stoasis.backend.domains.pin.api.LinkPinData
import com.stoasis.backend.shared.web.ApiException
import java.net.URI
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/links")
class LinkController {
    @GetMapping("/preview")
    fun preview(@RequestParam url: String): LinkPinData {
        val uri = try {
            URI(url)
        } catch (_: Exception) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Bitte eine vollständige URL eingeben.")
        }
        if (uri.scheme !in setOf("http", "https") || uri.host.isNullOrBlank()) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Bitte eine vollständige URL eingeben.")
        }
        val host = uri.host.removePrefix("www.")
        val title = uri.path.split('/').lastOrNull { it.isNotBlank() }
            ?.replace('-', ' ')
            ?.replace('_', ' ')
            ?.replaceFirstChar(Char::uppercase)
            ?: "Inhalt von $host"
        return LinkPinData(url, title, "Vorschau für $host.", null, host, (title.length % 12).coerceIn(2, 14), "ok")
    }
}
