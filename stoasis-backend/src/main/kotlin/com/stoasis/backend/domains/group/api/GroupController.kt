package com.stoasis.backend.domains.group.api

import com.stoasis.backend.domains.group.application.GroupService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty

@RestController
@ConditionalOnProperty(prefix = "stoasis.features", name = ["skills-enabled"], havingValue = "true")
@RequestMapping("/api/groups")
class GroupController(
    private val groups: GroupService,
    private val currentUser: CurrentUser,
) {
    @GetMapping
    fun list() = groups.list(currentUser.id())

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateGroupRequest) = groups.create(currentUser.id(), request)

    @GetMapping("/{groupId}")
    fun detail(@PathVariable groupId: String) = groups.detail(groupId, currentUser.id())

    @GetMapping("/{groupId}/skills")
    fun skills(@PathVariable groupId: String) = groups.aggregatedSkills(groupId, currentUser.id())

    @PatchMapping("/{groupId}/sharing")
    fun updateSharing(@PathVariable groupId: String, @RequestBody request: UpdateGroupSharingRequest) =
        groups.updateSharing(groupId, currentUser.id(), request.sharingPreference)

    @PostMapping("/join/{token}")
    fun join(@PathVariable token: String) = groups.join(token, currentUser.id())

    @DeleteMapping("/{groupId}/membership")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leave(@PathVariable groupId: String) = groups.leave(groupId, currentUser.id())

    @DeleteMapping("/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable groupId: String) = groups.delete(groupId, currentUser.id())
}
