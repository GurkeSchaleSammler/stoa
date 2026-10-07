package com.stoasis.backend.domains.world.application

import com.stoasis.backend.domains.collection.api.PublicCollectionDto
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.domains.world.api.AddWorldBoardRequest
import com.stoasis.backend.domains.world.api.CreateWorldRequest
import com.stoasis.backend.domains.world.api.UpdateWorldRequest
import com.stoasis.backend.domains.world.api.WorldBoardDto
import com.stoasis.backend.domains.world.api.WorldDetail
import com.stoasis.backend.domains.world.api.WorldLimitsDto
import com.stoasis.backend.domains.world.api.WorldPortalDto
import com.stoasis.backend.domains.world.api.WorldSummary
import com.stoasis.backend.domains.world.data.WorldBoardEntity
import com.stoasis.backend.domains.world.data.WorldBoardRepository
import com.stoasis.backend.domains.world.data.WorldEntity
import com.stoasis.backend.domains.world.data.WorldRepository
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/** Owns World membership, publication and plan-aware capacity. */
@Service
class WorldService(
    private val worlds: WorldRepository,
    private val worldBoards: WorldBoardRepository,
    private val collections: CollectionService,
    private val pins: PinRepository,
    private val plans: PlanService,
    private val ids: IdGenerator,
) {
    @Transactional(readOnly = true)
    fun list(userId: String): List<WorldSummary> = worlds.findAllByOwnerIdOrderByUpdatedAtDesc(userId).map { world ->
        WorldSummary(
            world.id, world.name, world.emoji, world.visibility,
            world.startCollection?.id.orEmpty(), world.boards.size, world.updatedAt,
        )
    }

    @Transactional(readOnly = true)
    fun forBoard(collectionId: String, userId: String): List<WorldDetail> {
        collections.requireView(collections.get(collectionId), userId)
        return worlds.findAllForBoard(userId, collectionId).map { toDetail(it, true) }
    }

    @Transactional
    fun create(userId: String, request: CreateWorldRequest): WorldDetail {
        plans.lock(userId)
        val limits = plans.limits(userId)
        val count = worlds.countByOwnerId(userId)
        if (count >= limits.worlds) {
            throw ApiException(HttpStatus.CONFLICT, "World-Limit erreicht (${limits.worlds}).")
        }
        val start = collections.get(request.startCollectionId)
        collections.requireEdit(start, userId)
        requireOrdinaryBoard(start)
        if (!limits.premium && start.ownerId != userId) {
            throw ApiException(HttpStatus.CONFLICT, "Öffentliche Free-Worlds können nur eigene Boards enthalten.")
        }
        val world = WorldEntity(
            id = "world-${ids.newId()}", ownerId = userId, name = request.name.trim(),
            emoji = request.emoji.ifBlank { "🌐" }, startCollection = start,
            visibility = if (limits.premium) Visibility.private else Visibility.public,
        )
        world.boards.add(WorldBoardEntity(world = world, collection = start))
        worlds.save(world)
        return detail(world.id, userId)
    }

    @Transactional(readOnly = true)
    fun detail(id: String, userId: String): WorldDetail = toDetail(requireOwner(get(id), userId), true)

    @Transactional
    fun update(id: String, userId: String, request: UpdateWorldRequest): WorldDetail {
        val world = requireOwner(lock(id), userId)
        request.name?.let { world.name = it.trim() }
        request.emoji?.let { world.emoji = it.ifBlank { "🌐" } }
        request.startCollectionId?.let { collectionId ->
            if (!worldBoards.existsByWorldIdAndCollectionId(world.id, collectionId)) {
                throw ApiException(HttpStatus.CONFLICT, "Das Startboard muss zur World gehören.")
            }
            world.startCollection = collections.get(collectionId)
        }
        request.visibility?.let { visibility -> setVisibility(world, userId, visibility) }
        world.updatedAt = Instant.now()
        return toDetail(get(world.id), true)
    }

    @Transactional
    fun addBoard(id: String, userId: String, request: AddWorldBoardRequest): WorldDetail {
        val world = requireOwner(lock(id), userId)
        if (worldBoards.existsByWorldIdAndCollectionId(id, request.collectionId)) return toDetail(get(id), true)
        val limits = plans.limits(userId)
        if (worldBoards.countByWorldId(id) >= limits.worldBoards) {
            throw ApiException(HttpStatus.CONFLICT, "Board-Limit dieser World erreicht (${limits.worldBoards}).")
        }
        val collection = collections.get(request.collectionId)
        collections.requireEdit(collection, userId)
        requireOrdinaryBoard(collection)
        if (world.visibility != Visibility.private && collection.ownerId != userId) {
            throw ApiException(HttpStatus.CONFLICT, "Geteilte Boards können nicht über eine öffentliche World veröffentlicht werden.")
        }
        world.boards.add(WorldBoardEntity(world = world, collection = collection))
        world.updatedAt = Instant.now()
        return toDetail(world, true)
    }

    @Transactional
    fun removeBoard(id: String, collectionId: String, userId: String): WorldDetail {
        val world = requireOwner(lock(id), userId)
        if (world.startCollection?.id == collectionId) {
            throw ApiException(HttpStatus.CONFLICT, "Das Startboard kann nicht entfernt werden.")
        }
        val connected = pins.findAllByPortalWorldId(id).any {
            it.collection?.id == collectionId || it.portalTargetCollection?.id == collectionId
        }
        if (connected) throw ApiException(HttpStatus.CONFLICT, "Entferne zuerst die Portale dieses Boards.")
        world.boards.removeIf { it.collection?.id == collectionId }
        world.updatedAt = Instant.now()
        return toDetail(world, true)
    }

    @Transactional
    fun delete(id: String, userId: String) {
        val world = requireOwner(lock(id), userId)
        pins.deleteAll(pins.findAllByPortalWorldId(id))
        worlds.delete(world)
    }

    @Transactional(readOnly = true)
    fun publicDetail(id: String, token: String?, viewerId: String?): WorldDetail =
        toDetail(requireShared(get(id), token, viewerId), false)

    @Transactional(readOnly = true)
    fun requireSharedBoard(id: String, collectionId: String, token: String?, viewerId: String?): WorldEntity {
        val world = requireShared(get(id), token, viewerId)
        if (!worldBoards.existsByWorldIdAndCollectionId(id, collectionId)) unavailable()
        return world
    }

    @Transactional(readOnly = true)
    fun publicBoardDetail(collectionId: String): PublicCollectionDto = collections.worldPublicDetail(collectionId)

    fun requirePortalMembership(worldId: String, sourceId: String, targetId: String, userId: String): WorldEntity {
        val world = requireOwner(get(worldId), userId)
        if (sourceId == targetId) throw ApiException(HttpStatus.BAD_REQUEST, "Ein Portal benötigt ein anderes Zielboard.")
        if (!worldBoards.existsByWorldIdAndCollectionId(worldId, sourceId) ||
            !worldBoards.existsByWorldIdAndCollectionId(worldId, targetId)
        ) {
            throw ApiException(HttpStatus.CONFLICT, "Beide Boards müssen zur selben World gehören.")
        }
        return world
    }

    private fun setVisibility(world: WorldEntity, userId: String, visibility: Visibility) {
        if (visibility != Visibility.public && !plans.limits(userId).premium) {
            throw ApiException(HttpStatus.FORBIDDEN, "Private Worlds und Linkfreigaben benötigen Premium.")
        }
        if (visibility != Visibility.private && world.boards.any { it.collection?.ownerId != userId }) {
            throw ApiException(HttpStatus.CONFLICT, "Eine öffentliche World darf nur eigene Boards enthalten.")
        }
        world.visibility = visibility
        world.shareToken = when (visibility) {
            Visibility.private, Visibility.public -> null
            Visibility.link -> world.shareToken ?: "world-share-${ids.newId()}"
        }
    }

    private fun toDetail(world: WorldEntity, includeSecret: Boolean): WorldDetail {
        val portalPins = pins.findAllByPortalWorldId(world.id)
        val backlinks = portalPins.groupingBy { it.portalTargetCollection?.id }.eachCount()
        val boardDtos = world.boards.mapNotNull { membership ->
            membership.collection?.let { collection ->
                WorldBoardDto(
                    collection.id, collection.name, collection.emoji,
                    pins.countByCollectionId(collection.id), collection.id == world.startCollection?.id,
                    backlinks[collection.id] ?: 0,
                )
            }
        }.sortedWith(compareByDescending<WorldBoardDto> { it.isStart }.thenBy { it.name.lowercase() })
        val limits = plans.limits(world.ownerId)
        val limitDto = if (includeSecret) {
            WorldLimitsDto(
                limits.premium, worlds.countByOwnerId(world.ownerId), limits.worlds,
                boardDtos.size, limits.worldBoards,
            )
        } else {
            WorldLimitsDto(false, 0, 0, boardDtos.size, 0)
        }
        return WorldDetail(
            id = world.id, name = world.name, emoji = world.emoji, visibility = world.visibility,
            ownerId = world.ownerId.takeIf { includeSecret }.orEmpty(),
            startCollectionId = world.startCollection?.id.orEmpty(),
            boardCount = boardDtos.size, shareToken = world.shareToken.takeIf { includeSecret }, boards = boardDtos,
            portals = portalPins.map { pin ->
                WorldPortalDto(
                    pin.id, pin.collection?.id.orEmpty(), pin.portalTargetCollection?.id,
                    pin.portalLabel ?: pin.portalTargetCollection?.name ?: "Entferntes Board",
                    pin.portalEmoji ?: pin.portalTargetCollection?.emoji ?: "↗",
                )
            },
            limits = limitDto,
            updatedAt = world.updatedAt,
        )
    }

    private fun requireOrdinaryBoard(collection: CollectionEntity) {
        if (collection.isSystem) throw ApiException(HttpStatus.CONFLICT, "Profil-Boards können nicht Teil einer World sein.")
    }

    private fun get(id: String) = worlds.findDetailedById(id) ?: unavailable()
    private fun lock(id: String) = worlds.lockById(id) ?: unavailable()
    private fun requireOwner(world: WorldEntity, userId: String): WorldEntity =
        world.takeIf { it.ownerId == userId } ?: unavailable()

    private fun requireShared(world: WorldEntity, token: String?, viewerId: String?): WorldEntity {
        val allowed = viewerId == world.ownerId || world.visibility == Visibility.public ||
            (world.visibility == Visibility.link && token != null && token == world.shareToken)
        return world.takeIf { allowed } ?: unavailable()
    }

    private fun unavailable(): Nothing = throw ApiException(HttpStatus.NOT_FOUND, "World nicht gefunden.")
}
