package com.stoasis.backend.domains.world.data

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface WorldRepository : JpaRepository<WorldEntity, String> {
    @EntityGraph(attributePaths = ["startCollection", "boards", "boards.collection"])
    fun findAllByOwnerIdOrderByUpdatedAtDesc(ownerId: String): List<WorldEntity>

    @EntityGraph(attributePaths = ["startCollection", "boards", "boards.collection"])
    @Query("select distinct w from WorldEntity w where w.id = :id")
    fun findDetailedById(@Param("id") id: String): WorldEntity?

    @EntityGraph(attributePaths = ["startCollection", "boards", "boards.collection"])
    @Query("select distinct w from WorldEntity w join w.boards wb where w.ownerId = :userId and wb.collection.id = :collectionId order by w.updatedAt desc")
    fun findAllForBoard(
        @Param("userId") userId: String,
        @Param("collectionId") collectionId: String,
    ): List<WorldEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WorldEntity w where w.id = :id")
    fun lockById(@Param("id") id: String): WorldEntity?

    fun countByOwnerId(ownerId: String): Long
}
