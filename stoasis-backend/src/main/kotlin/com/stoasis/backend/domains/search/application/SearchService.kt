package com.stoasis.backend.domains.search.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.search.api.SearchResultDto
import com.stoasis.backend.domains.search.api.TagDto
import com.stoasis.backend.domains.search.api.toSearchResult
import com.stoasis.backend.domains.search.data.TagEntity
import com.stoasis.backend.domains.search.data.TagRepository
import com.stoasis.backend.domains.skill.data.SkillDataRepository
import com.stoasis.backend.shared.web.ApiException
import com.stoasis.backend.domains.search.data.PinSearch
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.domains.collection.application.CollectionService
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import com.stoasis.backend.domains.collection.model.canEdit
import com.stoasis.backend.shared.id.IdGenerator
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Searches accessible pins and manages normalized tags. */
@Service
class SearchService(
    private val pins: PinRepository,
    private val pinService: PinService,
    private val tags: TagRepository,
    private val users: UserRepository,
    private val plans: PlanService,
    private val collections: CollectionService,
    private val idGenerator: IdGenerator,
) {
    @Transactional(readOnly = true)
    fun search(
        userId: String,
        query: String,
        type: PinType?,
        tag: String?,
        collectionId: String? = null,
        page: Int = 0,
        size: Int = 50,
        extraTags: List<String> = emptyList(),
        tagMode: String = "all",
    ): List<SearchResultDto> {
        if (page < 0 || size !in 1..100 || query.length > 500 || tagMode !in setOf("all", "any")) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Suchfilter oder Seitengrösse.")
        }
        val filters = normalizeTags(listOfNotNull(tag) + extraTags).toList()
        if (filters.size > 1) plans.requirePremium(userId)
        val request = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")))
        return pins.findAll(PinSearch.matching(userId, query.trim(), type, filters, tagMode, collectionId), request)
            .content.map { pinService.toDto(it).toSearchResult(it.collection?.name.orEmpty()) }
    }

    @Transactional(readOnly = true)
    fun findByTag(userId: String, tag: String): List<SearchResultDto> = search(userId, "", null, tag)

    @Transactional(readOnly = true)
    fun tags(userId: String): List<TagDto> {
        val explicit = tags.findAllByOwnerIdOrderByName(userId).associateBy { it.name }.toMutableMap()
        pins.findAllVisibleTo(userId).flatMap { it.tags }.forEach { name ->
            explicit.putIfAbsent(name, TagEntity(id = "tag-$name", name = name))
        }
        return explicit.values.sortedBy { it.name }.map { TagDto(it.id, it.name) }
    }

    @Transactional
    fun createTag(userId: String, rawName: String): TagDto {
        val name = normalizeTag(rawName)
        if (name.isBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "Tag-Name ist erforderlich.")
        if (tags.existsByOwnerIdAndName(userId, name)) {
            throw ApiException(HttpStatus.CONFLICT, "Diesen Tag gibt es bereits.")
        }
        val tag = tags.save(
            TagEntity(
                id = "tag-${idGenerator.newId()}",
                owner = users.getReferenceById(userId),
                name = name,
            ),
        )
        return TagDto(tag.id, tag.name)
    }

    @Transactional
    fun deleteTag(userId: String, id: String) {
        val explicit = tags.findByIdAndOwnerId(id, userId)
        val name = explicit?.name ?: id.removePrefix("tag-").takeIf(String::isNotBlank)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Tag nicht gefunden.")
        explicit?.let(tags::delete)
        pins.findAllVisibleTo(userId).filter { collections.roleOf(it.collection!!, userId)?.canEdit() == true }
            .forEach { pin ->
                if (pin.tags.removeIf { normalizeTag(it) == normalizeTag(name) }) pin.collection!!.updatedAt = java.time.Instant.now()
            }
    }
}
