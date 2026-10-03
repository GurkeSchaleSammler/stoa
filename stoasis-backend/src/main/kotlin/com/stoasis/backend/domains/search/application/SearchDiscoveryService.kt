package com.stoasis.backend.domains.search.application

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.domains.search.data.SavedSearchEntity
import com.stoasis.backend.domains.search.data.SavedSearchRepository
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper

/** Saves premium search filters and summarizes currently accessible tags. */
@Service
class SearchDiscoveryService(
    private val saved: SavedSearchRepository,
    private val pins: PinRepository,
    private val plans: PlanService,
    private val mapper: ObjectMapper,
    private val idGenerator: IdGenerator,
) {
    @Transactional(readOnly = true)
    fun list(userId: String) = saved.findAllByOwnerIdOrderByName(userId).map(::dto)

    @Transactional
    fun save(userId: String, request: SaveSearchRequest): SavedSearchDto {
        plans.lock(userId)
        plans.requirePremium(userId)
        if (request.name.isBlank() || request.name.length > 120 || request.query.q.length > 500 || request.query.tagMode !in setOf("all", "any")) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige gespeicherte Suche.")
        }
        if (saved.countByOwnerId(userId) >= 100) throw ApiException(HttpStatus.CONFLICT, "Höchstens 100 gespeicherte Suchen.")
        val query = request.query.copy(tags = normalizeTags(request.query.tags).toList())
        return dto(saved.save(SavedSearchEntity("search-${idGenerator.newId()}", userId, request.name.trim(), mapper.writeValueAsString(query))))
    }

    @Transactional
    fun delete(userId: String, id: String) {
        val search = saved.findByIdAndOwnerId(id, userId) ?: throw ApiException(HttpStatus.NOT_FOUND, "Suche nicht gefunden.")
        saved.delete(search)
    }

    @Transactional(readOnly = true)
    fun analytics(userId: String): List<TagUsage> {
        plans.requirePremium(userId)
        return pins.findAllVisibleTo(userId).flatMap { normalizeTags(it.tags) }
            .groupingBy { it }.eachCount().map { TagUsage(it.key, it.value) }
            .sortedWith(compareByDescending<TagUsage> { it.count }.thenBy { it.name })
    }

    private fun dto(entity: SavedSearchEntity) = SavedSearchDto(entity.id, entity.name, mapper.readValue(entity.queryJson, SavedSearchQuery::class.java))
}

/** Contains reusable filters, evaluated with current permissions on every search. */
data class SavedSearchQuery(val q: String = "", val type: PinType? = null, val tags: List<String> = emptyList(), val tagMode: String = "all")

/** Names a search to be saved. */
data class SaveSearchRequest(val name: String, val query: SavedSearchQuery)

/** Returns a named query without embedding its results. */
data class SavedSearchDto(val id: String, val name: String, val query: SavedSearchQuery)

/** Counts pins using one normalized tag. */
data class TagUsage(val name: String, val count: Int)
