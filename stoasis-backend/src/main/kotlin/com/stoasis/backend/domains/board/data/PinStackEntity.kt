package com.stoasis.backend.domains.board.data

import com.stoasis.backend.domains.collection.data.CollectionEntity
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table

@Entity
@Table(name = "pin_stacks")
class PinStackEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "collection_id", nullable = false)
    var collection: CollectionEntity? = null,
    @Column(name = "grid_x", nullable = false) var gridX: Int = 0,
    @Column(name = "grid_y", nullable = false) var gridY: Int = 0,
    @Column(name = "height_clips", nullable = false) var heightClips: Int = 16,
    @Column(nullable = false) var layer: Int = 0,
    @Column(nullable = false) var expanded: Boolean = false,
    @OneToMany(mappedBy = "stack", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("position ASC")
    var children: MutableList<PinStackChildEntity> = mutableListOf(),
)
