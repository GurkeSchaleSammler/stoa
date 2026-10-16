package com.stoasis.backend.domains.pin.data

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import com.stoasis.backend.domains.collection.model.PinType

/** Reads pins within collections and counts account usage. */
interface PinRepository : JpaRepository<PinEntity, String>, JpaSpecificationExecutor<PinEntity> {
    fun countByCreatedByIdAndType(userId: String, type: PinType): Long

    fun findAllByFileKey(fileKey: String): List<PinEntity>

    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection", "portalWorld", "portalTargetCollection"])
    fun findAllByCollectionIdOrderBySortOrder(collectionId: String): List<PinEntity>

    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection", "portalWorld", "portalTargetCollection"])
    @Query("select p from PinEntity p where p.id = :id and p.collection.id = :collectionId")
    fun findDetailed(@Param("collectionId") collectionId: String, @Param("id") id: String): PinEntity?

    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection", "portalWorld", "portalTargetCollection"])
    @Query("select p from PinEntity p join p.collection c where c.visibility = com.stoasis.backend.domains.collection.model.Visibility.public or exists (select m.id from CollectionMemberEntity m where m.collection = c and m.user.id = :userId)")
    fun findAllVisibleTo(@Param("userId") userId: String): List<PinEntity>

    fun countByCollectionIdAndIdIn(collectionId: String, ids: Collection<String>): Long

    fun countByCollectionId(collectionId: String): Long
    fun deleteAllByCollectionId(collectionId: String)

    @EntityGraph(attributePaths = ["collection", "portalTargetCollection", "portalWorld"])
    fun findAllByPortalWorldId(worldId: String): List<PinEntity>
}
