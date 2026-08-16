package com.stoasis.backend.domains.board.data

import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.pin.data.PinEntity
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

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
    @Column(name = "color_variant", nullable = false) var colorVariant: String = "accent",
)

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
    @Column(name = "color_variant", nullable = false) var colorVariant: String = "sage",
    var label: String? = null,
)

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

interface PinStackRepository : JpaRepository<PinStackEntity, String> {
    @EntityGraph(attributePaths = ["children", "children.pin", "collection"])
    fun findAllByCollectionIdOrderByLayer(collectionId: String): List<PinStackEntity>

    @EntityGraph(attributePaths = ["children", "children.pin", "collection"])
    @Query("select distinct s from PinStackEntity s where s.id = :id and s.collection.id = :collectionId")
    fun findDetailed(@Param("collectionId") collectionId: String, @Param("id") id: String): PinStackEntity?

    @EntityGraph(attributePaths = ["children", "children.pin", "collection"])
    @Query("select distinct s from PinStackEntity s join s.children child where child.pin.id = :pinId")
    fun findByChildPinId(@Param("pinId") pinId: String): PinStackEntity?
}

interface PinStackChildRepository : JpaRepository<PinStackChildEntity, Long> {
    fun existsByPinId(pinId: String): Boolean
    fun findAllByStackId(stackId: String): List<PinStackChildEntity>
}

interface BoardConnectorRepository : JpaRepository<BoardConnectorEntity, String> {
    @EntityGraph(attributePaths = ["sourcePin", "targetPin", "collection"])
    fun findAllByCollectionId(collectionId: String): List<BoardConnectorEntity>

    @EntityGraph(attributePaths = ["sourcePin", "targetPin", "collection"])
    fun findByIdAndCollectionId(id: String, collectionId: String): BoardConnectorEntity?

    fun existsByCollectionIdAndSourcePinIdAndTargetPinId(
        collectionId: String,
        sourcePinId: String,
        targetPinId: String,
    ): Boolean
}

interface SoftZoneRepository : JpaRepository<SoftZoneEntity, String> {
    fun findAllByCollectionId(collectionId: String): List<SoftZoneEntity>
    fun findByIdAndCollectionId(id: String, collectionId: String): SoftZoneEntity?
}

interface FloatingLabelRepository : JpaRepository<FloatingLabelEntity, String> {
    fun findAllByCollectionId(collectionId: String): List<FloatingLabelEntity>
    fun findByIdAndCollectionId(id: String, collectionId: String): FloatingLabelEntity?
}

interface StickerRepository : JpaRepository<StickerEntity, String> {
    fun findAllByCollectionIdOrderByLayer(collectionId: String): List<StickerEntity>
    fun findByIdAndCollectionId(id: String, collectionId: String): StickerEntity?
}
