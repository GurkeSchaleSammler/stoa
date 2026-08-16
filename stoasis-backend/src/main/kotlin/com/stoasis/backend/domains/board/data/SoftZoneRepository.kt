package com.stoasis.backend.domains.board.data

import org.springframework.data.jpa.repository.JpaRepository

interface SoftZoneRepository : JpaRepository<SoftZoneEntity, String> {
    fun findAllByCollectionId(collectionId: String): List<SoftZoneEntity>
    fun findByIdAndCollectionId(id: String, collectionId: String): SoftZoneEntity?
}
