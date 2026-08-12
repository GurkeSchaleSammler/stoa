package com.stoasis.backend.domains.profile.application

import com.stoasis.backend.domains.auth.api.UserDto
import com.stoasis.backend.domains.auth.api.toDto
import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.profile.api.ImportResult
import com.stoasis.backend.domains.profile.api.UpdateProfileRequest
import com.stoasis.backend.shared.web.ApiException
import java.net.URI
import java.time.Duration
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper

@Service
class ProfileService(
    private val users: UserRepository,
    private val collections: CollectionRepository,
    private val pins: PinRepository,
    private val pinService: PinService,
    private val objectMapper: ObjectMapper,
) {
    @Transactional
    fun update(userId: String, request: UpdateProfileRequest): UserDto {
        val user = users.getReferenceById(userId)
        request.name?.let { user.name = it.trim() }
        if (request.avatarUrl != null) user.avatarUrl = request.avatarUrl.ifBlank { null }
        return user.toDto()
    }

    @Transactional
    fun scheduleDeletion(userId: String) {
        users.getReferenceById(userId).deletionScheduledAt = Instant.now().plus(Duration.ofDays(30))
    }

    @Transactional(readOnly = true)
    fun exportJson(userId: String): ByteArray {
        val user = users.getReferenceById(userId)
        val data = mapOf(
            "exportedAt" to Instant.now(),
            "user" to user.toDto(),
            "collections" to collections.findAllForUser(userId).map { collection ->
                mapOf(
                    "id" to collection.id,
                    "name" to collection.name,
                    "pins" to pins.findAllByCollectionIdOrderBySortOrder(collection.id).map(pinService::toDto),
                )
            },
        )
        return objectMapper.writeValueAsBytes(data)
    }

    @Transactional(readOnly = true)
    fun exportCsv(userId: String): ByteArray {
        val rows = mutableListOf(listOf("collection", "type", "title_or_content", "url", "tags"))
        collections.findAllForUser(userId).forEach { collection ->
            pins.findAllByCollectionIdOrderBySortOrder(collection.id).forEach { pin ->
                val value = when (pin.type) {
                    PinType.link -> pin.title.orEmpty()
                    PinType.note -> pin.content.orEmpty()
                    PinType.photo -> pin.caption.orEmpty()
                }
                rows.add(listOf(collection.name, pin.type.name, value, pin.url.orEmpty(), pin.tags.joinToString("|")))
            }
        }
        fun escape(value: String) = "\"${value.replace("\"", "\"\"")}\""
        return rows.joinToString("\n") { row -> row.joinToString(",", transform = ::escape) }.toByteArray()
    }

    @Transactional
    fun importPocket(userId: String, csv: ByteArray): ImportResult {
        if (csv.isEmpty()) throw ApiException(HttpStatus.BAD_REQUEST, "Keine CSV-Datei empfangen.")
        val target = collections.findAllForUser(userId).firstOrNull { collection ->
            collection.members.any { it.user?.id == userId && it.role == Role.owner }
        } ?: throw ApiException(HttpStatus.CONFLICT, "Lege zuerst eine eigene Sammlung an.")
        val existingUrls = pins.findAllByCollectionIdOrderBySortOrder(target.id).mapNotNull { it.url }.toMutableSet()
        var imported = 0
        var skipped = 0
        csv.toString(Charsets.UTF_8).lineSequence().drop(1).filter(String::isNotBlank).forEach { line ->
            val columns = parseCsvLine(line)
            val url = columns.firstOrNull { it.startsWith("http://") || it.startsWith("https://") }
            if (url == null || !existingUrls.add(url)) {
                skipped++
            } else {
                val host = runCatching { URI(url).host }.getOrNull()
                pins.save(
                    PinEntity(
                        id = "pin-${UUID.randomUUID().toString().take(8)}",
                        collection = target,
                        type = PinType.link,
                        createdBy = users.getReferenceById(userId),
                        sortOrder = pins.countByCollectionId(target.id).toInt() + imported + 1,
                        url = url,
                        title = columns.firstOrNull()?.ifBlank { url } ?: url,
                        siteName = host,
                        parseStatus = "ok",
                        tags = linkedSetOf("pocket-import"),
                    ),
                )
                imported++
            }
        }
        target.updatedAt = Instant.now()
        return ImportResult(imported, skipped, emptyList())
    }

    private fun parseCsvLine(line: String): List<String> =
        line.split(',').map { it.trim().removeSurrounding("\"") }
}
