package com.stoasis.backend.domains.board.data

import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.pin.data.PinEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "board_connectors")
class BoardConnectorEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "collection_id", nullable = false)
    var collection: CollectionEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "source_pin_id", nullable = false)
    var sourcePin: PinEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "target_pin_id", nullable = false)
    var targetPin: PinEntity? = null,
    @Column(name = "color_variant", nullable = false, length = 32) var colorVariant: String = "accent",
)
