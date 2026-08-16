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
@Table(name = "stickers")
class StickerEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "collection_id", nullable = false)
    var collection: CollectionEntity? = null,
    @Column(name = "position_x", nullable = false) var positionX: Double = 0.0,
    @Column(name = "position_y", nullable = false) var positionY: Double = 0.0,
    @Column(name = "width_clips", nullable = false) var widthClips: Double = 4.0,
    @Column(name = "height_clips", nullable = false) var heightClips: Double = 4.0,
    @Column(nullable = false) var rotation: Double = 0.0,
    @Column(nullable = false) var layer: Int = 0,
    @Column(nullable = false) var motif: String = "star",
    @Column(name = "color_variant", nullable = false) var colorVariant: String = "sage",
)
