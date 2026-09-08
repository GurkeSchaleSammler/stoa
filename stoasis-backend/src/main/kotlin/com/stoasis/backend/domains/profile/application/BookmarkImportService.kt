package com.stoasis.backend.domains.profile.application

import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.domains.profile.api.ImportResult
import com.stoasis.backend.domains.profile.api.ImportRow
import com.stoasis.backend.shared.web.ApiException
import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.pin.model.PinGridRect
import com.stoasis.backend.domains.pin.utils.findFreePinPosition
import com.stoasis.backend.domains.board.data.PinStackRepository
import java.net.URI
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Previews validated rows and imports one atomic batch into an editable bookmark board. */
@Service
class BookmarkImportService(
    private val parser: BookmarkCsvParser,
    private val collections: CollectionService,
    private val boards: CollectionRepository,
    private val pins: PinRepository,
    private val plans: PlanService,
    private val stacks: PinStackRepository,
) {
    @Transactional(readOnly = true)
    fun preview(userId: String, collectionId: String, content: ByteArray): ImportResult {
        val board = destination(userId, collectionId)
        return report(rows(userId, board, content))
    }

    @Transactional
    fun import(userId: String, collectionId: String, content: ByteArray): ImportResult {
        boards.lockById(collectionId)
        val board = destination(userId, collectionId)
        val user = plans.lock(userId)
        val rows = rows(userId, board, content)
        val existing = pins.findAllByCollectionIdOrderBySortOrder(board.id)
        val occupied = existing.map { PinGridRect(it.gridX, it.gridY, 16, it.heightClips) }.toMutableList()
        occupied.addAll(stacks.findAllByCollectionIdOrderByLayer(board.id).map { PinGridRect(it.gridX, it.gridY, 16, it.heightClips) })
        var order = existing.maxOfOrNull { it.sortOrder } ?: 0
        var full = false
        val results = rows.map { row ->
            val result = when {
                row.status != "ready" -> row
                full -> row.copy(status = "failed", message = "Kein freier Platz auf dem Board.")
                else -> create(row, board, user, ++order, occupied)
            }
            if (row.status == "ready" && result.status == "failed") full = true
            result
        }
        if (results.any { it.status == "created" }) board.updatedAt = Instant.now()
        return report(results)
    }

    private fun create(row: ImportRow, board: CollectionEntity, user: UserEntity, order: Int, occupied: MutableList<PinGridRect>): ImportRow {
        val position = try {
            findFreePinPosition(18, occupied)
        } catch (_: ApiException) {
            return row.copy(status = "failed", message = "Kein freier Platz auf dem Board.")
        }
        pins.save(PinEntity(
            id = "pin-${UUID.randomUUID()}", collection = board, createdBy = user,
            type = PinType.link, sortOrder = order, title = row.title, url = row.url,
            siteName = URI(row.url!!).host, parseStatus = "ok", tags = row.tags.toMutableSet(),
            gridX = position.first, gridY = position.second, heightClips = 18, layer = order,
        ))
        occupied.add(PinGridRect(position.first, position.second, 16, 18))
        return row.copy(status = "created")
    }

    private fun destination(userId: String, id: String): CollectionEntity {
        val board = collections.get(id)
        collections.requireEdit(board, userId)
        if (board.isSystem || PinType.link !in board.allowedTypes) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Wähle ein Board, das Link-Pins erlaubt.")
        }
        return board
    }

    private fun rows(userId: String, board: CollectionEntity, content: ByteArray): List<ImportRow> {
        val known = pins.findAllByCollectionIdOrderBySortOrder(board.id).mapNotNull { it.url }
            .mapNotNull(parser::normalizeUrl).toMutableSet()
        return parser.parse(content, plans.limits(userId).importRows).map { row ->
            if (row.status == "ready" && !known.add(row.url!!)) row.copy(status = "duplicate", message = "URL bereits vorhanden.") else row
        }
    }

    private fun report(rows: List<ImportRow>) = ImportResult(
        imported = rows.count { it.status == "created" }, skipped = rows.count { it.status == "skipped" },
        duplicates = rows.count { it.status == "duplicate" }, failed = rows.count { it.status == "failed" },
        ready = rows.count { it.status == "ready" }, rows = rows,
        errors = rows.filter { it.status == "failed" }.map { "Zeile ${it.row}: ${it.message}" },
    )
}
