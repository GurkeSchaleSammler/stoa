package com.stoasis.backend.domains.collection.data

import com.stoasis.backend.domains.collection.model.Role
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface CollectionMemberRepository : JpaRepository<CollectionMemberEntity, Long> {
    @EntityGraph(attributePaths = ["user", "collection"])
    fun findAllByCollectionId(collectionId: String): List<CollectionMemberEntity>

    fun findByCollectionIdAndUserId(collectionId: String, userId: String): CollectionMemberEntity?
    fun countByCollectionIdAndRole(collectionId: String, role: Role): Long
}
