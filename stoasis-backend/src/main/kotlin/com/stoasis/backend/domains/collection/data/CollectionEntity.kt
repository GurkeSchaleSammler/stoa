package com.stoasis.backend.domains.collection.data

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.collection.model.Visibility
import jakarta.persistence.CascadeType
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import java.time.Instant

/** Stores a board, its visibility and membership. */
@Entity
@Table(name = "collections")
class CollectionEntity(
    @Id var id: String = "",
    @Column(nullable = false) var name: String = "",
    @Column(nullable = false) var emoji: String = "",
    @Column(name = "owner_id", nullable = false) var ownerId: String = "",
    @Enumerated(EnumType.STRING) @Column(nullable = false) var visibility: Visibility = Visibility.private,
    @Column(name = "accent") var accent: String? = null,
    @Column(name = "invite_token") var inviteToken: String? = null,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now(),
    @Enumerated(EnumType.STRING) @Column(name = "board_kind") var boardKind: BoardKind? = null,
    @Column(name = "is_system", nullable = false) var isSystem: Boolean = false,
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "collection_allowed_types", joinColumns = [JoinColumn(name = "collection_id")])
    @Column(name = "pin_type")
    @Enumerated(EnumType.STRING)
    var allowedTypes: MutableSet<PinType> = linkedSetOf(),
    @OneToMany(mappedBy = "collection", cascade = [CascadeType.ALL], orphanRemoval = true)
    var members: MutableSet<CollectionMemberEntity> = linkedSetOf(),
)
