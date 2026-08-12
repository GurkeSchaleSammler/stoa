package com.stoasis.backend.domains.collection.data

import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Role
import com.stoasis.backend.domains.collection.model.Visibility
import jakarta.persistence.CascadeType
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import java.time.Instant
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

@Entity
@Table(name = "collections")
class CollectionEntity(
    @Id var id: String = "",
    @Column(nullable = false) var name: String = "",
    @Column(nullable = false) var emoji: String = "",
    @Column(name = "owner_id", nullable = false) var ownerId: String = "",
    @Enumerated(EnumType.STRING) @Column(nullable = false) var visibility: Visibility = Visibility.private,
    @Column(name = "invite_token") var inviteToken: String? = null,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now(),
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "collection_allowed_types", joinColumns = [JoinColumn(name = "collection_id")])
    @Column(name = "pin_type")
    @Enumerated(EnumType.STRING)
    var allowedTypes: MutableSet<PinType> = linkedSetOf(),
    @OneToMany(mappedBy = "collection", cascade = [CascadeType.ALL], orphanRemoval = true)
    var members: MutableSet<CollectionMemberEntity> = linkedSetOf(),
)

@Entity
@Table(name = "collection_members")
class CollectionMemberEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "collection_id", nullable = false)
    var collection: CollectionEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    var user: UserEntity? = null,
    @Enumerated(EnumType.STRING) @Column(nullable = false) var role: Role = Role.viewer,
)

interface CollectionRepository : JpaRepository<CollectionEntity, String> {
    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    @Query("select distinct c from CollectionEntity c join c.members m where m.user.id = :userId")
    fun findAllForUser(@Param("userId") userId: String): List<CollectionEntity>

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    @Query("select c from CollectionEntity c where c.id = :id")
    fun findDetailedById(@Param("id") id: String): CollectionEntity?

    @EntityGraph(attributePaths = ["members", "members.user", "allowedTypes"])
    fun findByInviteToken(inviteToken: String): CollectionEntity?
}

interface CollectionMemberRepository : JpaRepository<CollectionMemberEntity, Long> {
    @EntityGraph(attributePaths = ["user", "collection"])
    fun findAllByCollectionId(collectionId: String): List<CollectionMemberEntity>

    fun findByCollectionIdAndUserId(collectionId: String, userId: String): CollectionMemberEntity?
    fun countByCollectionIdAndRole(collectionId: String, role: Role): Long
}
