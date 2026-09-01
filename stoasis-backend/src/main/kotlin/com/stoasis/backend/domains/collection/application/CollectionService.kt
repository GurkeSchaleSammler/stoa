package com.stoasis.backend.domains.collection.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.api.CollectionDetail
import com.stoasis.backend.domains.collection.api.CollectionIdResponse
import com.stoasis.backend.domains.collection.api.CollectionSummary
import com.stoasis.backend.domains.collection.api.CreateCollectionRequest
import com.stoasis.backend.domains.collection.api.MemberSummary
import com.stoasis.backend.domains.collection.api.PublicCollectionDto
import com.stoasis.backend.domains.collection.api.UpdateCollectionRequest
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.data.CollectionMemberEntity
import com.stoasis.backend.domains.collection.data.CollectionMemberRepository
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.collection.model.canEdit
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class CollectionService(
    private val collections: CollectionRepository,
    private val members: CollectionMemberRepository,
    private val users: UserRepository,
    private val pins: PinRepository,
) {
    @Transactional(readOnly = true)
    fun list(userId: String, filter: String): List<CollectionSummary> =
        collections.findAllForUser(userId)
            .filterNot { it.isSystem }
            .filter {
                when (filter) {
                    "personal" -> it.members.size == 1
                    "shared" -> it.members.size > 1
                    else -> true
                }
            }
            .sortedByDescending { it.updatedAt }
            .map(::summary)

    @Transactional(readOnly = true)
    fun detail(id: String, userId: String): CollectionDetail {
        val collection = get(id)
        val role = roleOf(collection, userId)
        if (role == null && collection.visibility != Visibility.public) forbidden()
        return detail(collection, role)
    }

    @Transactional
    fun create(userId: String, request: CreateCollectionRequest): CollectionDetail {
        val user = users.getReferenceById(userId)
        val id = "coll-${UUID.randomUUID().toString().take(8)}"
        val collection = CollectionEntity(
            id = id,
            name = request.name.trim(),
            emoji = request.emoji.ifBlank { "📌" },
            ownerId = userId,
            allowedTypes = request.allowedTypes.toMutableSet(),
        )
        collection.members.add(CollectionMemberEntity(collection = collection, user = user, role = Role.owner))
        collections.save(collection)
        return detail(collection, Role.owner)
    }

    @Transactional
    fun update(id: String, userId: String, request: UpdateCollectionRequest): CollectionDetail {
        val collection = get(id)
        val role = roleOf(collection, userId)
        if (role?.canEdit() != true) forbidden()
        if (collection.isSystem && (request.name != null || request.emoji != null || request.allowedTypes != null)) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Profil-Boards können nur geleert oder sichtbar gemacht werden.")
        }
        request.name?.let {
            if (it.isBlank()) throw ApiException(HttpStatus.BAD_REQUEST, "Name ist erforderlich.")
            collection.name = it.trim()
        }
        request.emoji?.let { collection.emoji = it.ifBlank { "📌" } }
        request.allowedTypes?.let {
            if (it.isEmpty()) throw ApiException(HttpStatus.BAD_REQUEST, "Mindestens ein Pin-Typ ist erforderlich.")
            collection.allowedTypes.clear()
            collection.allowedTypes.addAll(it)
        }
        request.visibility?.let { setVisibility(collection, it) }
        collection.updatedAt = Instant.now()
        return detail(collection, role)
    }

    @Transactional
    fun delete(id: String, userId: String) {
        val collection = get(id)
        if (roleOf(collection, userId) != Role.owner) {
            throw ApiException(HttpStatus.FORBIDDEN, "Nur der Owner darf löschen.")
        }
        if (collection.isSystem) {
            throw ApiException(HttpStatus.CONFLICT, "Profil-Boards können nicht gelöscht werden.")
        }
        collections.delete(collection)
    }

    @Transactional
    fun join(token: String, userId: String): CollectionIdResponse {
        val collection = collections.findByInviteToken(token)
            ?.takeIf { it.visibility == Visibility.link }
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Einladung ungültig oder abgelaufen.")
        if (roleOf(collection, userId) == null) {
            collection.members.add(
                CollectionMemberEntity(
                    collection = collection,
                    user = users.getReferenceById(userId),
                    role = Role.viewer,
                ),
            )
            collection.updatedAt = Instant.now()
        }
        return CollectionIdResponse(collection.id)
    }

    fun get(id: String): CollectionEntity = collections.findDetailedById(id)
        ?: throw ApiException(HttpStatus.NOT_FOUND, "Sammlung nicht gefunden.")

    @Transactional(readOnly = true)
    fun resolve(reference: String, userId: String): CollectionEntity {
        collections.findDetailedById(reference)?.let { collection ->
            requireView(collection, userId)
            return collection
        }
        val matches = collections.findAllForUser(userId)
            .filter { it.name.equals(reference, ignoreCase = true) }
        if (matches.isEmpty()) throw ApiException(HttpStatus.NOT_FOUND, "Sammlung nicht gefunden.")
        if (matches.size > 1) {
            throw ApiException(HttpStatus.CONFLICT, "Der Board-Name '$reference' ist nicht eindeutig.")
        }
        return matches.single()
    }

    fun roleOf(collection: CollectionEntity, userId: String): Role? =
        collection.members.firstOrNull { it.user?.id == userId }?.role

    fun requireView(collection: CollectionEntity, userId: String): Role? {
        val role = roleOf(collection, userId)
        if (role == null && collection.visibility != Visibility.public) forbidden()
        return role
    }

    fun requireEdit(collection: CollectionEntity, userId: String): Role {
        val role = roleOf(collection, userId)
        if (role?.canEdit() != true) throw ApiException(HttpStatus.FORBIDDEN, "Keine Schreibrechte.")
        return role
    }

    fun requireSharedView(collection: CollectionEntity, token: String?, viewerId: String?) {
        val isMember = viewerId != null && roleOf(collection, viewerId) != null
        val isPublic = collection.visibility == Visibility.public
        val hasLink = collection.visibility == Visibility.link && token != null && token == collection.inviteToken
        if (!isMember && !isPublic && !hasLink) forbidden()
    }

    @Transactional(readOnly = true)
    fun publicDetail(id: String, token: String?, viewerId: String?): PublicCollectionDto {
        val collection = get(id)
        requireSharedView(collection, token, viewerId)
        return PublicCollectionDto(
            collection.id,
            collection.name,
            collection.emoji,
            collection.allowedTypes,
            collection.visibility,
            pins.countByCollectionId(collection.id),
            collection.updatedAt,
            collection.boardKind,
        )
    }

    fun setVisibility(collection: CollectionEntity, visibility: Visibility) {
        collection.visibility = visibility
        collection.inviteToken = when (visibility) {
            Visibility.private -> null
            Visibility.link -> collection.inviteToken ?: "invite-${UUID.randomUUID().toString().take(8)}"
            Visibility.public -> null
        }
    }

    fun detail(collection: CollectionEntity, role: Role?) = CollectionDetail(
        id = collection.id,
        name = collection.name,
        emoji = collection.emoji,
        allowedTypes = collection.allowedTypes,
        visibility = collection.visibility,
        pinCount = pins.countByCollectionId(collection.id),
        members = collection.members.mapNotNull { membership ->
            membership.user?.let { MemberSummary(it.id, membership.role, it.name, it.avatarUrl) }
        },
        updatedAt = collection.updatedAt,
        boardKind = collection.boardKind,
        isSystem = collection.isSystem,
        ownerId = collection.ownerId,
        inviteToken = collection.inviteToken,
        currentUserRole = role,
    )

    private fun summary(collection: CollectionEntity) = CollectionSummary(
        id = collection.id,
        name = collection.name,
        emoji = collection.emoji,
        allowedTypes = collection.allowedTypes,
        visibility = collection.visibility,
        pinCount = pins.countByCollectionId(collection.id),
        members = collection.members.mapNotNull { membership ->
            membership.user?.let { MemberSummary(it.id, membership.role, it.name, it.avatarUrl) }
        },
        updatedAt = collection.updatedAt,
        boardKind = collection.boardKind,
        isSystem = collection.isSystem,
    )

    private fun forbidden(): Nothing = throw ApiException(HttpStatus.FORBIDDEN, "Kein Zugriff.")
}
