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
@Table(name = "soft_zones")
class SoftZoneEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "collection_id", nullable = false)
    var collection: CollectionEntity? = null,
    @Column(name = "grid_x", nullable = false) var gridX: Int = 0,
    @Column(name = "grid_y", nullable = false) var gridY: Int = 0,
    @Column(name = "width_clips", nullable = false) var widthClips: Int = 24,
    @Column(name = "height_clips", nullable = false) var heightClips: Int = 20,
    @Column(name = "color_variant", nullable = false, length = 32) var colorVariant: String = "sage",
    var label: String? = null,
)
