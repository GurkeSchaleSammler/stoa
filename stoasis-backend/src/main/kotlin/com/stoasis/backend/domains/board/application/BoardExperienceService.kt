package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.*
import com.stoasis.backend.domains.board.data.BoardExperienceRepository
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class BoardExperienceService(
    private val collections: CollectionService,
    private val support: BoardElementSupport,
    private val policy: BoardFeaturePolicy,
    private val repository: BoardExperienceRepository,
    private val ids: IdGenerator,
    private val clock: Clock,
) {
    @Transactional(readOnly = true)
    fun list(boardId: String, userId: String): BoardExperienceDto {
        val board = collections.get(boardId)
        collections.requireView(board, userId)
        val premium = policy.premium(board)
        return BoardExperienceDto(repository.paths(boardId), repository.dates(boardId), if (premium) null else 7, if (premium) null else 10)
    }

    @Transactional
    fun savePath(boardId: String, userId: String, id: String?, request: SavePresentationPathRequest): PresentationPathDto {
        val board = policy.editable(boardId, userId)
        if (id != null && !repository.exists(boardId, id)) missing()
        if (id == null) policy.requireCapacity(board, repository.count(boardId), 7, "board.presentation_path_limit")
        val name = request.name.trim()
        if (name.isEmpty() || name.length > 120 || request.pinIds.isEmpty()) throw ApiException(HttpStatus.BAD_REQUEST, "Ein Pfad braucht einen Namen (maximal 120 Zeichen) und mindestens eine Station.")
        support.requirePins(boardId, request.pinIds)
        val path = PresentationPathDto(id ?: "path-${ids.newId()}", name, request.pinIds)
        repository.savePath(boardId, path, id == null)
        board.updatedAt = clock.instant()
        return path
    }

    @Transactional
    fun deletePath(boardId: String, userId: String, id: String) {
        val board = policy.editable(boardId, userId)
        if (!repository.exists(boardId, id)) missing()
        repository.deletePath(boardId, id)
        board.updatedAt = clock.instant()
    }

    @Transactional
    fun saveDate(boardId: String, userId: String, pinId: String, request: SavePinDateRequest) {
        val board = policy.editable(boardId, userId)
        support.getPin(boardId, pinId)
        if (request.endDate != null && (request.startDate == null || request.endDate < request.startDate)) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Das Enddatum darf nicht vor dem Startdatum liegen.", code = "board.invalid_date_range")
        }
        if (listOfNotNull(request.startDate, request.endDate).any { it.year !in 1..9999 }) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Das Jahr muss zwischen 1 und 9999 liegen.")
        }
        repository.saveDate(boardId, pinId, request)
        board.updatedAt = clock.instant()
    }

    private fun missing(): Nothing = throw ApiException(HttpStatus.NOT_FOUND, "Präsentationspfad nicht gefunden.")
}
