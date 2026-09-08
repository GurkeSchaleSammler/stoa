package com.stoasis.backend.domains.skill.api

import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.skill.application.ProfileBoardService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import com.stoasis.backend.domains.pin.api.UpdateGridBlockRequest

/** Provides skill editing and profile presentation settings. */
@RestController
@ConditionalOnProperty(prefix = "stoasis.features", name = ["skills-enabled"], havingValue = "true")
@RequestMapping("/api/profile-boards")
class ProfileBoardController(
    private val profileBoards: ProfileBoardService,
    private val currentUser: CurrentUser,
) {
    @GetMapping
    fun list() = profileBoards.list(currentUser.id())

    @PostMapping("/{kind}/skills")
    fun createSkill(@PathVariable kind: BoardKind, @Valid @RequestBody request: SaveProfileSkillRequest) =
        profileBoards.createSkill(currentUser.id(), kind, request)

    @PatchMapping("/{kind}/skills/{pinId}")
    fun updateSkill(
        @PathVariable kind: BoardKind,
        @PathVariable pinId: String,
        @Valid @RequestBody request: SaveProfileSkillRequest,
    ) = profileBoards.updateSkill(currentUser.id(), kind, pinId, request)

    @DeleteMapping("/{kind}/skills/{pinId}")
    fun deleteSkill(@PathVariable kind: BoardKind, @PathVariable pinId: String) =
        profileBoards.deleteSkill(currentUser.id(), kind, pinId)

    @PatchMapping("/{kind}/skills/{pinId}/grid")
    fun moveSkill(
        @PathVariable kind: BoardKind,
        @PathVariable pinId: String,
        @RequestBody grid: UpdateGridBlockRequest,
    ) = profileBoards.moveSkill(currentUser.id(), kind, pinId, grid)

    @PatchMapping("/{kind}/accent")
    fun setAccent(@PathVariable kind: BoardKind, @RequestBody request: UpdateProfileAccentRequest) =
        profileBoards.setAccent(currentUser.id(), kind, request.accent)

    @PatchMapping("/{kind}/visibility")
    fun setVisibility(
        @PathVariable kind: BoardKind,
        @RequestBody request: UpdateProfileBoardVisibilityRequest,
    ) = profileBoards.setVisibility(currentUser.id(), kind, request.visibility)
}

/** Exposes profile boards through explicit public or token-based read access. */
@RestController
@ConditionalOnProperty(prefix = "stoasis.features", name = ["skills-enabled"], havingValue = "true")
@RequestMapping("/api/public/profile-boards")
class PublicProfileBoardController(
    private val profileBoards: ProfileBoardService,
    private val currentUser: CurrentUser,
) {
    @GetMapping("/{id}")
    fun view(@PathVariable id: String, @RequestParam(required = false) token: String?) =
        profileBoards.sharedView(id, token, currentUser.idOrNull())
}
