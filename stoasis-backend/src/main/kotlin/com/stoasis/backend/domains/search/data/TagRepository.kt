package com.stoasis.backend.domains.search.data

import org.springframework.data.jpa.repository.JpaRepository

interface TagRepository : JpaRepository<TagEntity, String> {
    fun findAllByOwnerIdOrderByName(ownerId: String): List<TagEntity>
    fun findByIdAndOwnerId(id: String, ownerId: String): TagEntity?
    fun existsByOwnerIdAndName(ownerId: String, name: String): Boolean
}
