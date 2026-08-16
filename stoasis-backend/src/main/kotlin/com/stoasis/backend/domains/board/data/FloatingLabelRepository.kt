package com.stoasis.backend.domains.board.data

import org.springframework.data.jpa.repository.JpaRepository

interface FloatingLabelRepository : JpaRepository<FloatingLabelEntity, String> {
    fun findAllByCollectionId(collectionId: String): List<FloatingLabelEntity>
    fun findByIdAndCollectionId(id: String, collectionId: String): FloatingLabelEntity?
}
