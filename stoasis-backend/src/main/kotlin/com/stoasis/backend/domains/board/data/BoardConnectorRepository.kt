package com.stoasis.backend.domains.board.data

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface BoardConnectorRepository : JpaRepository<BoardConnectorEntity, String> {
    fun countByCollectionIdAndLabelNot(collectionId: String, label: String): Long

    @EntityGraph(attributePaths = ["sourcePin", "targetPin", "collection"])
    fun findAllByCollectionId(collectionId: String): List<BoardConnectorEntity>

    @EntityGraph(attributePaths = ["sourcePin", "targetPin", "collection"])
    fun findByIdAndCollectionId(id: String, collectionId: String): BoardConnectorEntity?

    @EntityGraph(attributePaths = ["sourcePin", "targetPin", "collection"])
    fun findByCollectionIdAndSourcePinIdAndTargetPinId(
        collectionId: String,
        sourcePinId: String,
        targetPinId: String,
    ): BoardConnectorEntity?

    fun existsByCollectionIdAndSourcePinIdAndTargetPinId(
        collectionId: String,
        sourcePinId: String,
        targetPinId: String,
    ): Boolean
}
