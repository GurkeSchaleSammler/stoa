package com.stoasis.backend.domains.search.api

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.search.application.SearchService
import com.stoasis.backend.shared.security.CurrentUser
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

/** Exposes paginated search and tag management. */
@RestController
class SearchController(private val search: SearchService, private val currentUser: CurrentUser) {
    @GetMapping("/api/search")
    fun search(
        @RequestParam(defaultValue = "") q: String,
        @RequestParam(required = false) type: PinType?,
        @RequestParam(required = false) tag: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @RequestParam(required = false) tags: List<String>?,
        @RequestParam(defaultValue = "all") tagMode: String,
    ) = search.search(currentUser.id(), q, type, tag, page = page, size = size, extraTags = tags.orEmpty(), tagMode = tagMode)

    @GetMapping("/api/tags")
    fun tags() = search.tags(currentUser.id())

    @PostMapping("/api/tags")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: CreateTagRequest) = search.createTag(currentUser.id(), request.name)

    @DeleteMapping("/api/tags/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) = search.deleteTag(currentUser.id(), id)
}
