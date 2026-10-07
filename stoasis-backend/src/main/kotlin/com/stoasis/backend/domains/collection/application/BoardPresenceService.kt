package com.stoasis.backend.domains.collection.application

import com.stoasis.backend.domains.collection.api.BoardCursorPosition
import com.stoasis.backend.domains.collection.api.BoardPresenceParticipant
import com.stoasis.backend.domains.collection.data.BoardPresenceEntity
import com.stoasis.backend.domains.collection.data.BoardPresenceRepository
import com.stoasis.backend.domains.collection.data.CollectionMemberRepository
import com.stoasis.backend.shared.id.IdGenerator
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

/** Ephemeral, membership-scoped presence shared by every application replica. */
@Service
class BoardPresenceService(
    private val members: CollectionMemberRepository,
    private val presence: BoardPresenceRepository,
    private val clock: Clock,
    private val ids: IdGenerator,
) {
    @Transactional
    fun exchange(boardId: String, userId: String, clientId: String, cursor: BoardCursorPosition?): List<BoardPresenceParticipant> {
        val member = members.lockPresenceMember(boardId, userId)
            ?: throw ApiException(HttpStatus.FORBIDDEN, "Kein Zugriff.")
        if (cursor != null && (!cursor.x.isFinite() || !cursor.y.isFinite() || cursor.x !in 0.0..2240.0 || cursor.y !in 0.0..3360.0)) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige Cursorposition.")
        }
        val now = clock.instant()
        val entry = presence.findByMemberIdAndClientId(member.id!!, clientId) ?: run {
            if (presence.countByMemberId(member.id!!) >= 8) {
                throw ApiException(HttpStatus.TOO_MANY_REQUESTS, "Zu viele offene Board-Tabs.")
            }
            BoardPresenceEntity(id = ids.newId(), member = member, clientId = clientId)
        }
        entry.x = cursor?.x
        entry.y = cursor?.y
        entry.seenAt = now
        presence.saveAndFlush(entry)
        return presence.active(boardId, now.minus(TTL))
            .filter { it.member!!.user!!.id != userId }
            // An idle second window must not hide the same user's actively pointing window.
            .sortedBy { it.x == null }
            .distinctBy { it.member!!.user!!.id }
            .map {
                val user = it.member!!.user!!
                BoardPresenceParticipant(user.id, user.name, it.x?.let { x -> BoardCursorPosition(x, it.y!!) })
            }
            .sortedBy { it.userId }
    }

    @Transactional
    fun leave(boardId: String, userId: String, clientId: String) {
        // Idempotent after membership removal; never targets another user's tab.
        val member = members.lockPresenceMember(boardId, userId) ?: return
        presence.findByMemberIdAndClientId(member.id!!, clientId)?.let(presence::delete)
    }

    @Transactional
    fun expire() { presence.deleteExpired(clock.instant().minus(TTL)) }

    companion object { val TTL: Duration = Duration.ofSeconds(8) }
}
