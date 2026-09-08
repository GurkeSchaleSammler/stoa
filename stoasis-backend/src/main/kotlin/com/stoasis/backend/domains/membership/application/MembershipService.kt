package com.stoasis.backend.domains.membership.application

import com.stoasis.backend.domains.collection.api.CollectionIdResponse
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionMemberRepository
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.membership.api.InviteInfo
import com.stoasis.backend.domains.membership.api.MemberDto
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Manages invitations and preserves at least one owner per board. */
@Service
class MembershipService(
    private val collectionService: CollectionService,
    private val collections: CollectionRepository,
    private val members: CollectionMemberRepository,
    private val policy: CollaborationPolicy,
) {
    @Transactional(readOnly = true)
    fun list(collectionId: String, userId: String): List<MemberDto> {
        val collection = collectionService.get(collectionId)
        if (collectionService.roleOf(collection, userId) == null) forbidden()
        return members.findAllByCollectionId(collectionId).map { membership ->
            val user = membership.user!!
            MemberDto(user.id, membership.role, user.name, user.email, user.avatarUrl)
        }
    }

    @Transactional
    fun updateRole(collectionId: String, targetUserId: String, userId: String, role: Role): MemberDto {
        requireOwner(collectionId, userId)
        val member = members.findByCollectionIdAndUserId(collectionId, targetUserId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Mitglied nicht gefunden.")
        if (member.role == Role.owner && role != Role.owner && members.countByCollectionIdAndRole(collectionId, Role.owner) <= 1) {
            throw ApiException(HttpStatus.CONFLICT, "Mindestens ein Owner muss bleiben.")
        }
        if (role == Role.owner && member.role != Role.owner) policy.requireOwnership(targetUserId, member.collection!!)
        member.role = role
        transferPrimaryOwner(member.collection!!, targetUserId)
        member.collection?.updatedAt = Instant.now()
        val user = member.user!!
        return MemberDto(user.id, role, user.name, user.email, user.avatarUrl)
    }

    @Transactional
    fun remove(collectionId: String, targetUserId: String, userId: String) {
        requireOwner(collectionId, userId)
        val member = members.findByCollectionIdAndUserId(collectionId, targetUserId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Mitglied nicht gefunden.")
        if (member.role == Role.owner && members.countByCollectionIdAndRole(collectionId, Role.owner) <= 1) {
            throw ApiException(HttpStatus.CONFLICT, "Mindestens ein Owner muss bleiben.")
        }
        member.collection?.updatedAt = Instant.now()
        val board = member.collection!!
        board.members.remove(member)
        members.delete(member)
        transferPrimaryOwner(board, targetUserId)
    }

    @Transactional(readOnly = true)
    fun invite(collectionId: String, userId: String, baseUrl: String): InviteInfo {
        val collection = collectionService.get(collectionId)
        if (collectionService.roleOf(collection, userId) == null) forbidden()
        return inviteInfo(collection.id, userId, baseUrl)
    }

    @Transactional
    fun setInvite(collectionId: String, userId: String, visibility: Visibility, baseUrl: String): InviteInfo {
        val collection = requireOwner(collectionId, userId)
        collectionService.setVisibility(collection, visibility)
        collection.updatedAt = Instant.now()
        return inviteInfo(collectionId, userId, baseUrl)
    }

    @Transactional(readOnly = true)
    fun preview(token: String, userId: String, baseUrl: String): InviteInfo {
        val collection = collections.findByInviteToken(token)
            ?.takeIf { it.visibility == Visibility.link }
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Einladung ungültig oder abgelaufen.")
        return info(collection.id, token, baseUrl, collection.visibility, collection.name, collectionService.roleOf(collection, userId) != null)
    }

    @Transactional
    fun join(token: String, userId: String): CollectionIdResponse = collectionService.join(token, userId)

    private fun inviteInfo(collectionId: String, userId: String, baseUrl: String): InviteInfo {
        val collection = collectionService.get(collectionId)
        val token = collection.inviteToken.orEmpty().takeIf { collectionService.roleOf(collection, userId) == Role.owner }.orEmpty()
        return info(collection.id, token, baseUrl, collection.visibility, collection.name, collectionService.roleOf(collection, userId) != null)
    }

    private fun info(id: String, token: String, baseUrl: String, visibility: Visibility, name: String, member: Boolean) =
        InviteInfo(
            collectionId = id,
            token = token,
            url = if (token.isBlank()) "" else "$baseUrl/join/$token",
            visibility = visibility,
            collectionName = name,
            alreadyMember = member,
            capacity = policy.capacity(collectionService.get(id)),
        )

    private fun requireOwner(collectionId: String, userId: String) = collections.lockById(collectionId)?.also {
        if (collectionService.roleOf(it, userId) != Role.owner) {
            throw ApiException(HttpStatus.FORBIDDEN, "Nur der Owner darf Mitglieder verwalten.")
        }
    } ?: throw ApiException(HttpStatus.NOT_FOUND, "Sammlung nicht gefunden.")

    private fun transferPrimaryOwner(board: com.stoasis.backend.domains.collection.data.CollectionEntity, userId: String) {
        if (board.ownerId != userId) return
        val owner = board.members.firstOrNull { it.role == Role.owner } ?: return
        board.ownerId = owner.user!!.id
    }

    private fun forbidden(): Nothing = throw ApiException(HttpStatus.FORBIDDEN, "Kein Zugriff.")
}
