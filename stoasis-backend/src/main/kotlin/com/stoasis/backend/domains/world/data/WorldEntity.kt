package com.stoasis.backend.domains.world.data

import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.model.Visibility
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import java.time.Instant

/** A navigable collection of boards owned and published as one Stoasis World. */
@Entity
@Table(name = "worlds")
class WorldEntity(
    @Id var id: String = "",
    @Column(name = "owner_id", nullable = false) var ownerId: String = "",
    @Column(nullable = false) var name: String = "",
    @Column(nullable = false) var emoji: String = "🌐",
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    var visibility: Visibility = Visibility.private,
    @Column(name = "share_token") var shareToken: String? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "start_collection_id", nullable = false)
    var startCollection: CollectionEntity? = null,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: Instant = Instant.now(),
    @OneToMany(mappedBy = "world", cascade = [CascadeType.ALL], orphanRemoval = true)
    var boards: MutableSet<WorldBoardEntity> = linkedSetOf(),
)
