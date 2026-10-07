package com.stoasis.backend.domains.world.data

import org.springframework.data.jpa.repository.JpaRepository

interface WorldBoardRepository : JpaRepository<WorldBoardEntity, Long> {
    fun existsByCollectionId(collectionId: String): Boolean
    fun existsByWorldIdAndCollectionId(worldId: String, collectionId: String): Boolean
    fun countByWorldId(worldId: String): Long
    fun findByWorldIdAndCollectionId(worldId: String, collectionId: String): WorldBoardEntity?
}
