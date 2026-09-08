package com.stoasis.backend.domains.search.api

import com.stoasis.backend.domains.search.application.SaveSearchRequest
import com.stoasis.backend.domains.search.application.SearchDiscoveryService
import com.stoasis.backend.shared.security.CurrentUser
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

/** Provides saved searches and premium tag statistics for the signed-in account. */
@RestController
@RequestMapping("/api/search")
class SearchDiscoveryController(private val discovery: SearchDiscoveryService, private val currentUser: CurrentUser) {
    @GetMapping("/saved")
    fun list() = discovery.list(currentUser.id())

    @PostMapping("/saved")
    @ResponseStatus(HttpStatus.CREATED)
    fun save(@RequestBody request: SaveSearchRequest) = discovery.save(currentUser.id(), request)

    @DeleteMapping("/saved/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) = discovery.delete(currentUser.id(), id)

    @GetMapping("/tag-analytics")
    fun analytics() = discovery.analytics(currentUser.id())
}
