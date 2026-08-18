package com.stoasis.backend.domains.group.api

import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.group.model.SharingPreference
import com.stoasis.backend.domains.skill.model.SkillLevel
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class CreateGroupRequest(
    @field:NotBlank @field:Size(max = 120) val name: String,
)

data class UpdateGroupSharingRequest(val sharingPreference: SharingPreference)

data class GroupMemberDto(
    val userId: String,
    val name: String,
    val sharingPreference: SharingPreference?,
    val joinedAt: Instant,
)

data class GroupSummaryDto(
    val id: String,
    val name: String,
    val ownerId: String,
    val memberCount: Int,
    val mySharingPreference: SharingPreference,
    val createdAt: Instant,
)

data class GroupDetailDto(
    val id: String,
    val name: String,
    val ownerId: String,
    val inviteToken: String?,
    val mySharingPreference: SharingPreference,
    val members: List<GroupMemberDto>,
    val createdAt: Instant,
)

data class GroupSkillDto(
    val pinId: String,
    val boardKind: BoardKind,
    val skillName: String,
    val level: SkillLevel,
    val yearsExperience: Int?,
)

data class GroupSkillMemberDto(
    val userId: String,
    val name: String,
    val skills: List<GroupSkillDto>,
)

data class GroupJoinResponse(val groupId: String)

