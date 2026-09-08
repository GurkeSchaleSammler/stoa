package com.stoasis.backend.domains.membership.application

import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

/** Checks the owning account's collaboration capacity. */
@Service
class CollaborationPolicy(private val plans: PlanService, private val collections: CollectionRepository) {
    fun capacity(board: CollectionEntity): CollaborationCapacity {
        val limits = plans.limits(board.ownerId)
        val shared = ownedSharedBoards(board.ownerId)
        val reason = when {
            board.isSystem -> "Profil-Boards werden nur lesend geteilt."
            board.members.size >= limits.members -> "Mitgliederlimit erreicht (${limits.members})."
            !isShared(board) && shared >= limits.sharedBoards -> "Limit geteilter Boards erreicht (${limits.sharedBoards})."
            else -> null
        }
        return CollaborationCapacity(limits.members, limits.sharedBoards, shared, reason)
    }

    fun requireInvite(board: CollectionEntity) {
        plans.lock(board.ownerId)
        capacity(board).limitReason?.let { throw ApiException(HttpStatus.CONFLICT, it) }
    }

    fun requireOwnership(userId: String, board: CollectionEntity) {
        if (!isShared(board)) return
        plans.lock(userId)
        val limit = plans.limits(userId).sharedBoards
        if (ownedSharedBoards(userId) >= limit) {
            throw ApiException(HttpStatus.CONFLICT, "Das neue Owner-Konto hat das Limit geteilter Boards erreicht ($limit).")
        }
    }

    private fun ownedSharedBoards(userId: String) = collections.findAllForUser(userId)
        .count { board -> !board.isSystem && isShared(board) && board.members.any { it.user?.id == userId && it.role == Role.owner } }

    private fun isShared(board: CollectionEntity) = board.members.size > 1 || board.visibility != Visibility.private
}

/** Explains invitation limits before an owner changes sharing. */
data class CollaborationCapacity(
    val memberLimit: Int,
    val sharedBoardLimit: Int,
    val ownedSharedBoards: Int,
    val limitReason: String?,
)
