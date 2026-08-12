package com.stoasis.backend.domains.search.data

import com.stoasis.backend.domains.auth.data.UserEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository

@Entity
@Table(name = "tags")
class TagEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_id", nullable = false)
    var owner: UserEntity? = null,
    @Column(nullable = false) var name: String = "",
)

interface TagRepository : JpaRepository<TagEntity, String> {
    fun findAllByOwnerIdOrderByName(ownerId: String): List<TagEntity>
    fun findByIdAndOwnerId(id: String, ownerId: String): TagEntity?
    fun existsByOwnerIdAndName(ownerId: String, name: String): Boolean
}
