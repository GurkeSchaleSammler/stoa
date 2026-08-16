package com.stoasis.backend.domains.board.data

import org.springframework.data.jpa.repository.JpaRepository

interface StickerRepository : JpaRepository<StickerEntity, String> {
    fun findAllByCollectionIdOrderByLayer(collectionId: String): List<StickerEntity>
    fun findByIdAndCollectionId(id: String, collectionId: String): StickerEntity?
}
