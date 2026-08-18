package com.stoasis.backend.domains.group.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.group.api.CreateGroupRequest
import com.stoasis.backend.domains.group.api.GroupDetailDto
import com.stoasis.backend.domains.group.api.GroupJoinResponse
import com.stoasis.backend.domains.group.api.GroupMemberDto
import com.stoasis.backend.domains.group.api.GroupSkillDto
import com.stoasis.backend.domains.group.api.GroupSkillMemberDto
import com.stoasis.backend.domains.group.api.GroupSummaryDto
import com.stoasis.backend.domains.group.data.GroupEntity
import com.stoasis.backend.domains.group.data.GroupEntityRepository
import com.stoasis.backend.domains.group.data.GroupMemberEntity
import com.stoasis.backend.domains.group.data.GroupMemberId
import com.stoasis.backend.domains.group.data.GroupMemberRepository
import com.stoasis.backend.domains.group.model.SharingPreference
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.skill.data.SkillDataRepository
import com.stoasis.backend.shared.web.ApiException
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GroupService(
    private val groups: GroupEntityRepository,
    private val memberships: GroupMemberRepository,
    private val users: UserRepository,
    private val collections: CollectionRepository,
    private val pins: PinRepository,
    private val skillData: SkillDataRepository,
) {
    @Transactional(readOnly = true)
    fun list(userId: String): List<GroupSummaryDto> = groups.findAllForUser(userId)
        .sortedByDescending { it.createdAt }
        .map { group ->
            GroupSummaryDto(
                id = group.id,
                name = group.name,
                ownerId = group.ownerId,
                memberCount = group.members.size,
                mySharingPreference = membership(group, userId).sharingPreference,
                createdAt = group.createdAt,
            )
        }

    @Transactional
    fun create(userId: String, request: CreateGroupRequest): GroupDetailDto {
        val group = GroupEntity(
            id = "group-${UUID.randomUUID().toString().take(8)}",
            name = request.name.trim(),
            ownerId = userId,
            inviteToken = "group-invite-${UUID.randomUUID().toString().take(16)}",
        )
        group.members.add(
            GroupMemberEntity(
                id = GroupMemberId(group.id, userId),
                group = group,
                user = users.getReferenceById(userId),
                sharingPreference = SharingPreference.NONE,
            ),
        )
        groups.save(group)
        return detailDto(group, userId)
    }

    @Transactional(readOnly = true)
    fun detail(groupId: String, userId: String): GroupDetailDto = detailDto(requireMember(groupId, userId), userId)

    @Transactional
    fun updateSharing(groupId: String, userId: String, preference: SharingPreference): GroupDetailDto {
        val group = requireMember(groupId, userId)
        membership(group, userId).sharingPreference = preference
        return detailDto(group, userId)
    }

    @Transactional
    fun join(token: String, userId: String): GroupJoinResponse {
        val group = groups.findByInviteToken(token)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Gruppeneinladung ist ungültig.")
        if (group.members.none { it.user?.id == userId }) {
            group.members.add(
                GroupMemberEntity(
                    id = GroupMemberId(group.id, userId),
                    group = group,
                    user = users.getReferenceById(userId),
                    sharingPreference = SharingPreference.NONE,
                ),
            )
        }
        return GroupJoinResponse(group.id)
    }

    @Transactional
    fun leave(groupId: String, userId: String) {
        val group = requireMember(groupId, userId)
        if (group.ownerId == userId) {
            throw ApiException(HttpStatus.CONFLICT, "Der Gruppen-Owner kann die Gruppe nicht verlassen.")
        }
        group.members.removeIf { it.user?.id == userId }
    }

    @Transactional
    fun delete(groupId: String, userId: String) {
        val group = requireMember(groupId, userId)
        if (group.ownerId != userId) throw ApiException(HttpStatus.FORBIDDEN, "Nur der Owner darf die Gruppe löschen.")
        groups.delete(group)
    }

    @Transactional(readOnly = true)
    fun aggregatedSkills(groupId: String, userId: String): List<GroupSkillMemberDto> {
        val group = requireMember(groupId, userId)
        return group.members.mapNotNull { member ->
            val user = member.user ?: return@mapNotNull null
            val boardKinds = member.sharingPreference.boardKinds()
            if (boardKinds.isEmpty()) return@mapNotNull null
            val sharedSkills = boardKinds.flatMap { kind ->
                val board = collections.findByOwnerIdAndBoardKind(user.id, kind) ?: return@flatMap emptyList()
                val boardPins = pins.findAllByCollectionIdOrderBySortOrder(board.id)
                val dataByPin = skillData.findAllByPinIdIn(boardPins.map { it.id }).associateBy { it.pinId }
                boardPins.mapNotNull { pin ->
                    dataByPin[pin.id]?.let { skill ->
                        GroupSkillDto(pin.id, kind, skill.skillName, skill.level, skill.yearsExperience?.toInt())
                    }
                }
            }
            sharedSkills.takeIf { it.isNotEmpty() }?.let {
                GroupSkillMemberDto(user.id, user.name, it)
            }
        }.sortedBy { it.name.lowercase() }
    }

    private fun requireMember(groupId: String, userId: String): GroupEntity {
        val group = groups.findDetailedById(groupId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Gruppe nicht gefunden.")
        membership(group, userId)
        return group
    }

    private fun membership(group: GroupEntity, userId: String): GroupMemberEntity =
        group.members.firstOrNull { it.user?.id == userId }
            ?: throw ApiException(HttpStatus.FORBIDDEN, "Kein Zugriff auf diese Gruppe.")

    private fun detailDto(group: GroupEntity, viewerId: String): GroupDetailDto {
        val ownMembership = membership(group, viewerId)
        return GroupDetailDto(
            id = group.id,
            name = group.name,
            ownerId = group.ownerId,
            inviteToken = group.inviteToken.takeIf { group.ownerId == viewerId },
            mySharingPreference = ownMembership.sharingPreference,
            members = group.members.mapNotNull { member ->
                member.user?.let { user ->
                    GroupMemberDto(
                        user.id,
                        user.name,
                        member.sharingPreference.takeIf { user.id == viewerId },
                        member.joinedAt,
                    )
                }
            }.sortedBy { it.name.lowercase() },
            createdAt = group.createdAt,
        )
    }
}
