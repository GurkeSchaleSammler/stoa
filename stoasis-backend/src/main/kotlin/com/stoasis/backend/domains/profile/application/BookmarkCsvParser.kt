package com.stoasis.backend.domains.profile.application

import com.stoasis.backend.domains.profile.api.ImportRow
import com.stoasis.backend.domains.search.application.normalizeTags
import com.stoasis.backend.shared.web.ApiException
import java.net.URI
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVRecord
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

/** Parses UTF-8 bookmark CSV without interpreting markup or formulas. */
@Component
class BookmarkCsvParser {
    fun parse(content: ByteArray, limit: Int): List<ImportRow> {
        try {
            val text = Charsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(content)).toString().removePrefix("\uFEFF")
            val format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true).setTrim(true).get()
            format.parse(text.reader()).use { parser ->
                if (parser.headerNames.none { it == "url" || it == "resolved_url" }) {
                    throw ApiException(HttpStatus.BAD_REQUEST, "CSV benötigt eine Spalte url oder resolved_url.")
                }
                return parser.asSequence().take(limit + 1).map(::row).toList().also {
                    if (it.size > limit) throw ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Höchstens $limit CSV-Zeilen pro Import.")
                }
            }
        } catch (error: ApiException) {
            throw error
        } catch (_: Exception) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige CSV-Datei. UTF-8 und korrekt geschlossene Anführungszeichen erforderlich.")
        }
    }

    private fun row(record: CSVRecord): ImportRow {
        val number = record.recordNumber.toInt() + 1
        if (!record.isConsistent) return ImportRow(number, status = "failed", message = "Spaltenzahl stimmt nicht.")
        val type = value(record, "type")
        if (type.isNotBlank() && type != "link") return ImportRow(number, status = "skipped", message = "Kein Lesezeichen.")
        val url = normalizeUrl(value(record, "resolved_url").ifBlank { value(record, "url") })
            ?: return ImportRow(number, status = "failed", message = "Gültige HTTP- oder HTTPS-URL erforderlich.")
        val title = value(record, "title").ifBlank { value(record, "title_or_content") }.ifBlank { url }
        if (title.length > 1000) return ImportRow(number, url = url, status = "failed", message = "Titel zu lang.")
        return try {
            val tags = normalizeTags(value(record, "tags").split('|', ',')).toList()
            ImportRow(number, title, url, tags, "ready")
        } catch (error: ApiException) {
            ImportRow(number, title, url, status = "failed", message = error.message)
        }
    }

    fun normalizeUrl(value: String): String? = runCatching {
        val uri = URI(value.trim()).normalize()
        if (uri.scheme?.lowercase() !in setOf("http", "https") || uri.host.isNullOrBlank() || uri.userInfo != null) return null
        if (value.length > 4096 || uri.port !in -1..65535) return null
        val port = uri.port.takeUnless { it == -1 || it == 80 && uri.scheme.equals("http", true) || it == 443 && uri.scheme.equals("https", true) }
        val authority = uri.host.lowercase() + (port?.let { ":$it" } ?: "")
        "${uri.scheme.lowercase()}://$authority${uri.rawPath.ifBlank { "/" }}" +
            (uri.rawQuery?.let { "?$it" } ?: "") + (uri.rawFragment?.let { "#$it" } ?: "")
    }.getOrNull()

    private fun value(record: CSVRecord, name: String) = if (record.isMapped(name)) record.get(name).trim() else ""
}
