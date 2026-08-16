package com.stoasis.backend.domains.pin.data

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface PinRepository : JpaRepository<PinEntity, String> {
    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection"])
    fun findAllByCollectionIdOrderBySortOrder(collectionId: String): List<PinEntity>

    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection"])
    @Query("select p from PinEntity p where p.id = :id and p.collection.id = :collectionId")
    fun findDetailed(@Param("collectionId") collectionId: String, @Param("id") id: String): PinEntity?

    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection"])
    @Query("select distinct p from PinEntity p join p.collection c join c.members m where m.user.id = :userId")
    fun findAllVisibleTo(@Param("userId") userId: String): List<PinEntity>

    fun countByCollectionId(collectionId: String): Long
    fun deleteAllByCollectionId(collectionId: String)
}
