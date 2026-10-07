package com.stoasis.backend.domains.world.api

import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.world.application.WorldService
import com.stoasis.backend.shared.security.CurrentUser
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/worlds")
class PublicWorldController(
    private val worlds: WorldService,
    private val pins: PinService,
    private val currentUser: CurrentUser,
) {
    @GetMapping("/{id}")
    fun detail(@PathVariable id: String, @RequestParam(required = false) token: String?) =
        worlds.publicDetail(id, token, currentUser.idOrNull())

    @GetMapping("/{id}/boards/{collectionId}")
    fun board(
        @PathVariable id: String,
        @PathVariable collectionId: String,
        @RequestParam(required = false) token: String?,
    ): WorldBoardContentDto {
        worlds.requireSharedBoard(id, collectionId, token, currentUser.idOrNull())
        return WorldBoardContentDto(worlds.publicBoardDetail(collectionId), pins.listAuthorized(collectionId))
    }
}
