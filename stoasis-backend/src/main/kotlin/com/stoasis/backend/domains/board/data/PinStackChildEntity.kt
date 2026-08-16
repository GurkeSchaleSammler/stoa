package com.stoasis.backend.domains.board.data

import com.stoasis.backend.domains.pin.data.PinEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "pin_stack_children")
class PinStackChildEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "stack_id", nullable = false)
    var stack: PinStackEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "pin_id", nullable = false)
    var pin: PinEntity? = null,
    @Column(name = "child_order", nullable = false) var position: Int = 0,
    @Column(name = "original_x", nullable = false) var originalX: Int = 0,
    @Column(name = "original_y", nullable = false) var originalY: Int = 0,
    @Column(name = "original_layer", nullable = false) var originalLayer: Int = 0,
)
