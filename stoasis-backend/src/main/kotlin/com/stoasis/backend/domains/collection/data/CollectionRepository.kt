package com.stoasis.backend.domains.collection.data

import com.stoasis.backend.domains.collection.model.BoardKind
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.jpa.repository.Lock
import jakarta.persistence.LockModeType

/** Loads visible board relationships and locks membership changes. */
interface CollectionRepository : JpaRepository<CollectionEntity, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CollectionEntity c where c.id = :id")
    fun lockById(id: String): CollectionEntity?

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    @Query("select distinct c from CollectionEntity c join c.members m where m.user.id = :userId")
    fun findAllForUser(@Param("userId") userId: String): List<CollectionEntity>

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    @Query("select c from CollectionEntity c where c.id = :id")
    fun findDetailedById(@Param("id") id: String): CollectionEntity?

    @Query("select c.id from CollectionEntity c where c.inviteToken = :token")
    fun findIdByInviteToken(token: String): String?

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    fun findByInviteToken(inviteToken: String): CollectionEntity?

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    fun findByOwnerIdAndBoardKind(ownerId: String, boardKind: BoardKind): CollectionEntity?
}
