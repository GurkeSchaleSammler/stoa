package com.stoasis.backend.domains.collection.data

import com.stoasis.backend.domains.collection.model.Role
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import jakarta.persistence.LockModeType

interface CollectionMemberRepository : JpaRepository<CollectionMemberEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from CollectionMemberEntity m where m.collection.id = :boardId and m.user.id = :userId")
    fun lockPresenceMember(boardId: String, userId: String): CollectionMemberEntity?

    @EntityGraph(attributePaths = ["user", "collection"])
    fun findAllByCollectionId(collectionId: String): List<CollectionMemberEntity>

    fun findByCollectionIdAndUserId(collectionId: String, userId: String): CollectionMemberEntity?
    fun countByCollectionIdAndRole(collectionId: String, role: Role): Long
}
