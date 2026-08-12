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
import com.stoasis.backend.shared.web.ApiException
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SearchService(
    private val pins: PinRepository,
    private val pinService: PinService,
    private val tags: TagRepository,
    private val users: UserRepository,
) {
    @Transactional(readOnly = true)
    fun search(userId: String, query: String, type: PinType?, tag: String?): List<SearchResultDto> {
        val q = query.trim().lowercase()
        if (q.isBlank()) return emptyList()
        return pins.findAllVisibleTo(userId)
            .asSequence()
            .filter { type == null || it.type == type }
            .filter { tag.isNullOrBlank() || it.tags.any { value -> value.equals(tag, true) } }
            .filter { pin ->
                listOf(pin.title, pin.description, pin.content, pin.caption, pin.url, pin.siteName)
                    .filterNotNull()
                    .any { it.lowercase().contains(q) } || pin.tags.any { it.lowercase().contains(q) }
            }
            .map { pinService.toDto(it).toSearchResult(it.collection?.name.orEmpty()) }
            .toList()
    }

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
        val name = rawName.trim().lowercase()
        if (name.isBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "Tag-Name ist erforderlich.")
        if (tags.existsByOwnerIdAndName(userId, name)) {
            throw ApiException(HttpStatus.CONFLICT, "Diesen Tag gibt es bereits.")
        }
        val tag = tags.save(
            TagEntity(
                id = "tag-${UUID.randomUUID().toString().take(8)}",
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
        pins.findAllVisibleTo(userId).forEach { pin -> pin.tags.removeIf { it == name } }
    }
}
