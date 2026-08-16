package com.stoasis.backend.domains.collection.data

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface CollectionRepository : JpaRepository<CollectionEntity, String> {
    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    @Query("select distinct c from CollectionEntity c join c.members m where m.user.id = :userId")
    fun findAllForUser(@Param("userId") userId: String): List<CollectionEntity>

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    @Query("select c from CollectionEntity c where c.id = :id")
    fun findDetailedById(@Param("id") id: String): CollectionEntity?

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    fun findByInviteToken(inviteToken: String): CollectionEntity?
}
