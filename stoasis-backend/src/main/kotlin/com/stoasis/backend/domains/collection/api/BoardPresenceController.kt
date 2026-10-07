package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.application.BoardPresenceService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class BoardCursorPosition(
    @field:DecimalMin("0") @field:DecimalMax("2240") val x: Double,
    @field:DecimalMin("0") @field:DecimalMax("3360") val y: Double,
)

data class BoardPresenceRequest(@field:Valid val cursor: BoardCursorPosition? = null)
data class BoardPresenceParticipant(val userId: String, val name: String, val cursor: BoardCursorPosition?)

@RestController
@RequestMapping("/api/collections/{collectionId}/presence")
class BoardPresenceController(private val presence: BoardPresenceService, private val currentUser: CurrentUser) {
    @PostMapping("/{clientId}")
    fun exchange(
        @PathVariable collectionId: String,
        @PathVariable clientId: UUID,
        @Valid @RequestBody request: BoardPresenceRequest,
    ) = presence.exchange(collectionId, currentUser.id(), clientId.toString(), request.cursor)

    @DeleteMapping("/{clientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leave(@PathVariable collectionId: String, @PathVariable clientId: UUID) =
        presence.leave(collectionId, currentUser.id(), clientId.toString())
}
