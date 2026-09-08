package com.stoasis.backend.domains.profile.application

import com.stoasis.backend.domains.auth.api.toDto
import com.stoasis.backend.domains.board.application.BoardElementQueryService
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.shared.web.ApiException
import java.io.StringWriter
import java.time.Instant
import java.time.temporal.ChronoUnit
import org.apache.commons.csv.CSVFormat
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper

/** Exports owned content and reserves the daily free export in the same transaction. */
@Service
class ProfileExportService(
    private val boards: CollectionRepository,
    private val collections: CollectionService,
    private val pins: PinRepository,
    private val pinService: PinService,
    private val elements: BoardElementQueryService,
    private val plans: PlanService,
    private val mapper: ObjectMapper,
    private val archive: ProfileArchiveService,
) {
    @Transactional
    fun export(userId: String, format: String, scope: String): ByteArray {
        if (format !in setOf("json", "csv") || scope !in setOf("boards", "account")) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültiges Exportformat oder Exportziel.")
        }
        val user = plans.lock(userId)
        val now = Instant.now()
        if (scope == "account" || format == "csv") plans.requirePremium(userId)
        if (!plans.limits(userId).premium && user.lastExportAt?.truncatedTo(ChronoUnit.DAYS) == now.truncatedTo(ChronoUnit.DAYS)) {
            throw ApiException(HttpStatus.TOO_MANY_REQUESTS, "Free erlaubt einen Export pro Tag. Morgen ist dein nächster Export verfügbar.")
        }
        val owned = boards.findAllForUser(userId).filter { collections.roleOf(it, userId) == Role.owner }
        val data = owned.map { board ->
            mapOf("id" to board.id, "name" to board.name, "emoji" to board.emoji, "boardKind" to board.boardKind,
                "visibility" to board.visibility, "allowedTypes" to board.allowedTypes, "accent" to board.accent,
                "pins" to pins.findAllByCollectionIdOrderBySortOrder(board.id).map(pinService::toDto),
                "elements" to elements.snapshot(board.id))
        }
        val result = if (format == "csv") csv(data) else mapper.writeValueAsBytes(
            mapOf("version" to 1, "exportedAt" to now, "user" to user.toDto(), "collections" to data,
                "account" to if (scope == "account") archive.data(userId) else null),
        )
        user.lastExportAt = now
        return result
    }

    private fun csv(boards: List<Map<String, Any?>>): ByteArray {
        val output = StringWriter()
        CSVFormat.DEFAULT.print(output).use { csv ->
            csv.printRecord("collection", "type", "title", "url", "tags", "data")
            boards.forEach { board ->
                val node = mapper.valueToTree<tools.jackson.databind.JsonNode>(board)
                node.get("pins").forEach { pin ->
                    csv.printRecord(csvRow(node.get("name").asString(), pin).map(::safeCell))
                }
            }
        }
        return output.toString().toByteArray(Charsets.UTF_8)
    }

    private fun csvRow(board: String, pin: tools.jackson.databind.JsonNode): List<String> {
        val data = pin.get("data")
        val title = listOf("title", "content", "caption", "skillName")
            .mapNotNull { data.get(it)?.takeUnless { value -> value.isNull }?.asString() }.firstOrNull().orEmpty()
        return listOf(board, pin.get("type").asString(), title, data.get("url")?.asString().orEmpty(),
            pin.get("tags").joinToString("|") { it.asString() }, data.toString())
    }

    private fun safeCell(value: String): String =
        if (value.trimStart().firstOrNull() in setOf('=', '+', '-', '@') || value.startsWith('\t') || value.startsWith('\r')) "'$value" else value
}
