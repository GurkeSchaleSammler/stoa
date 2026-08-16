package com.stoasis.backend.domains.board.data

import com.stoasis.backend.domains.collection.data.CollectionEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "floating_labels")
class FloatingLabelEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "collection_id", nullable = false)
    var collection: CollectionEntity? = null,
    @Column(name = "grid_x", nullable = false) var gridX: Int = 0,
    @Column(name = "grid_y", nullable = false) var gridY: Int = 0,
    @Column(name = "width_clips", nullable = false) var widthClips: Int = 4,
    @Column(nullable = false) var text: String = "",
    @Column(nullable = false) var layer: Int = 0,
)
