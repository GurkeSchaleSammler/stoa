package com.stoasis.backend.domains.collection.data

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.Instant

interface BoardPresenceRepository : JpaRepository<BoardPresenceEntity, String> {
    fun findByMemberIdAndClientId(memberId: Long, clientId: String): BoardPresenceEntity?
    fun countByMemberId(memberId: Long): Long

    @Query("select p from BoardPresenceEntity p join fetch p.member m join fetch m.user where m.collection.id = :boardId and p.seenAt > :since order by p.seenAt desc, p.id")
    fun active(boardId: String, since: Instant): List<BoardPresenceEntity>

    @Modifying
    @Query("delete from BoardPresenceEntity p where p.seenAt <= :before")
    fun deleteExpired(before: Instant): Int
}
