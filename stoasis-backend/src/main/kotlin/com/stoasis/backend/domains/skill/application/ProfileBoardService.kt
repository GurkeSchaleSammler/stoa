package com.stoasis.backend.domains.skill.application

import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.api.UpdateCollectionRequest
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.data.CollectionMemberEntity
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.pin.api.CreatePinRequest
import com.stoasis.backend.domains.pin.api.UpdatePinRequest
import com.stoasis.backend.domains.pin.api.UpdateGridBlockRequest
import com.stoasis.backend.domains.pin.api.GridBlockDto
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.skill.api.ProfileBoardDto
import com.stoasis.backend.domains.skill.api.ProfileSkillDto
import com.stoasis.backend.domains.skill.api.SaveProfileSkillRequest
import com.stoasis.backend.domains.skill.data.SkillDataRepository
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper

@Service
class ProfileBoardService(
    private val collections: CollectionRepository,
    private val collectionService: CollectionService,
    private val users: UserRepository,
    private val pins: PinRepository,
    private val pinService: PinService,
    private val skillData: SkillDataRepository,
    private val objectMapper: ObjectMapper,
) {
    @Transactional
    fun ensureForUser(user: UserEntity) {
        BoardKind.entries.forEach { kind ->
            if (collections.findByOwnerIdAndBoardKind(user.id, kind) == null) {
                collections.save(newBoard(user, kind))
            }
        }
    }

    @Transactional
    fun list(userId: String): List<ProfileBoardDto> {
        val user = users.findById(userId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, "Nutzer nicht gefunden.")
        }
        ensureForUser(user)
        return BoardKind.entries.map { kind -> toDto(board(userId, kind), includeToken = true) }
    }

    @Transactional
    fun createSkill(userId: String, kind: BoardKind, request: SaveProfileSkillRequest): ProfileBoardDto {
        val board = board(userId, kind)
        pinService.create(board.id, userId, CreatePinRequest(PinType.skill, skillJson(request)))
        return toDto(board, includeToken = true)
    }

    @Transactional
    fun updateSkill(
        userId: String,
        kind: BoardKind,
        pinId: String,
        request: SaveProfileSkillRequest,
    ): ProfileBoardDto {
        val board = board(userId, kind)
        pinService.update(board.id, pinId, userId, UpdatePinRequest(data = skillJson(request)))
        return toDto(board, includeToken = true)
    }

    @Transactional
    fun deleteSkill(userId: String, kind: BoardKind, pinId: String): ProfileBoardDto {
        val board = board(userId, kind)
        pinService.delete(board.id, pinId, userId)
        return toDto(board, includeToken = true)
    }

    @Transactional
    fun moveSkill(
        userId: String,
        kind: BoardKind,
        pinId: String,
        grid: UpdateGridBlockRequest,
    ): ProfileBoardDto {
        val board = board(userId, kind)
        pinService.update(board.id, pinId, userId, UpdatePinRequest(grid = grid))
        return toDto(board, includeToken = true)
    }

    @Transactional
    fun setVisibility(userId: String, kind: BoardKind, visibility: Visibility): ProfileBoardDto {
        val board = board(userId, kind)
        collectionService.update(board.id, userId, UpdateCollectionRequest(visibility = visibility))
        return toDto(board, includeToken = true)
    }

    @Transactional(readOnly = true)
    fun sharedView(boardId: String, token: String?, viewerId: String?): ProfileBoardDto {
        val board = collections.findDetailedById(boardId)
            ?.takeIf { it.boardKind != null }
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Profil-Board nicht gefunden.")
        val isMember = viewerId != null && collectionService.roleOf(board, viewerId) != null
        val allowed = isMember || board.visibility == Visibility.public ||
            (board.visibility == Visibility.link && token != null && token == board.inviteToken)
        if (!allowed) throw ApiException(HttpStatus.FORBIDDEN, "Kein Zugriff.")
        return toDto(board, includeToken = false)
    }

    private fun board(userId: String, kind: BoardKind): CollectionEntity =
        collections.findByOwnerIdAndBoardKind(userId, kind)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Profil-Board nicht gefunden.")

    private fun newBoard(user: UserEntity, kind: BoardKind): CollectionEntity {
        val board = CollectionEntity(
            id = "profile-${kind.name.lowercase()}-${user.id}",
            name = if (kind == BoardKind.WORK) "Work" else "Personal",
            emoji = if (kind == BoardKind.WORK) "💼" else "🌿",
            ownerId = user.id,
            visibility = Visibility.private,
            boardKind = kind,
            isSystem = true,
            allowedTypes = linkedSetOf(PinType.skill),
        )
        board.members.add(CollectionMemberEntity(collection = board, user = user, role = Role.owner))
        return board
    }

    private fun skillJson(request: SaveProfileSkillRequest) = objectMapper.valueToTree<tools.jackson.databind.JsonNode>(
        mapOf(
            "skillName" to request.skillName.trim(),
            "level" to request.level.name,
            "yearsExperience" to request.yearsExperience,
        ),
    )

    private fun toDto(board: CollectionEntity, includeToken: Boolean): ProfileBoardDto {
        val boardPins = pins.findAllByCollectionIdOrderBySortOrder(board.id)
        val details = skillData.findAllByPinIdIn(boardPins.map { it.id }).associateBy { it.pinId }
        return ProfileBoardDto(
            id = board.id,
            name = board.name,
            boardKind = board.boardKind!!,
            visibility = board.visibility,
            shareToken = board.inviteToken.takeIf { includeToken },
            skills = boardPins.mapNotNull { pin ->
                details[pin.id]?.let { skill ->
                    ProfileSkillDto(
                        pin.id,
                        skill.skillName,
                        skill.level,
                        skill.yearsExperience?.toInt(),
                        pin.createdAt,
                        GridBlockDto(
                            id = pin.id,
                            x = pin.gridX,
                            y = pin.gridY,
                            heightClips = pin.heightClips,
                            layer = pin.layer,
                            contentType = pin.type,
                        ),
                    )
                }
            },
        )
    }
}
