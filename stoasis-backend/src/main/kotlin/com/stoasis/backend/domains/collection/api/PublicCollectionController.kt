package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.shared.security.CurrentUser
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/collections")
class PublicCollectionController(
    private val collections: CollectionService,
    private val pins: PinService,
    private val currentUser: CurrentUser,
) {
    @GetMapping("/{id}")
    fun detail(@PathVariable id: String, @RequestParam(required = false) token: String?) =
        collections.publicDetail(id, token, currentUser.idOrNull())

    @GetMapping("/{id}/pins")
    fun pins(@PathVariable id: String, @RequestParam(required = false) token: String?) =
        pins.listShared(id, token, currentUser.idOrNull())
}

