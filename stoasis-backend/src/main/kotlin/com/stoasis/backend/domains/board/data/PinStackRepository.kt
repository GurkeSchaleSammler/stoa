package com.stoasis.backend.domains.board.data

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface PinStackRepository : JpaRepository<PinStackEntity, String> {
    @EntityGraph(attributePaths = ["children", "children.pin", "collection"])
    fun findAllByCollectionIdOrderByLayer(collectionId: String): List<PinStackEntity>

    @EntityGraph(attributePaths = ["children", "children.pin", "collection"])
    @Query("select distinct s from PinStackEntity s where s.id = :id and s.collection.id = :collectionId")
    fun findDetailed(@Param("collectionId") collectionId: String, @Param("id") id: String): PinStackEntity?

    @EntityGraph(attributePaths = ["children", "children.pin", "collection"])
    @Query("select distinct s from PinStackEntity s join s.children child where child.pin.id = :pinId")
    fun findByChildPinId(@Param("pinId") pinId: String): PinStackEntity?
}
