package com.stoasis.backend.domains.search.data

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository

/** Stores an account's named search without caching permission-sensitive results. */
@Entity
@Table(name = "saved_searches")
class SavedSearchEntity(
    @Id var id: String = "",
    @Column(name = "owner_id", nullable = false) var ownerId: String = "",
    @Column(nullable = false) var name: String = "",
    @Column(name = "query_json", nullable = false) var queryJson: String = "",
)

/** Reads saved searches within their owning account. */
interface SavedSearchRepository : JpaRepository<SavedSearchEntity, String> {
    fun findAllByOwnerIdOrderByName(ownerId: String): List<SavedSearchEntity>
    fun countByOwnerId(ownerId: String): Long
    fun findByIdAndOwnerId(id: String, ownerId: String): SavedSearchEntity?
}
