package com.stoasis.backend.domains.pin.data

import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.model.PinType
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
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "pins")
class PinEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "collection_id", nullable = false)
    var collection: CollectionEntity? = null,
    @Enumerated(EnumType.STRING) @Column(nullable = false) var type: PinType = PinType.note,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by", nullable = false)
    var createdBy: UserEntity? = null,
    @Column(name = "sort_order", nullable = false) var sortOrder: Int = 0,
    @Column(name = "grid_x", nullable = false) var gridX: Int = 0,
    @Column(name = "grid_y", nullable = false) var gridY: Int = 0,
    @Column(name = "height_clips", nullable = false) var heightClips: Int = 16,
    @Column(name = "width_clips", nullable = false) var widthClips: Int = 16,
    @Column(name = "base_height_clips", nullable = false) var baseHeightClips: Int = heightClips,
    @Column(name = "manual_size", nullable = false) var manualSize: Boolean = false,
    @Column(nullable = false) var layer: Int = 0,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    @Column(name = "pin_color", length = 32) var color: String? = null,
    var url: String? = null,
    var title: String? = null,
    @Column(columnDefinition = "TEXT") var description: String? = null,
    @Column(name = "image_url") var imageUrl: String? = null,
    @Column(name = "site_name") var siteName: String? = null,
    @Column(name = "reading_time_min") var readingTimeMin: Int? = null,
    @Column(name = "parse_status") var parseStatus: String? = null,
    @Column(columnDefinition = "TEXT") var content: String? = null,
    @Column(name = "note_color") var noteColor: String? = null,
    @Column(name = "file_key") var fileKey: String? = null,
    var caption: String? = null,
    @Column(name = "image_width") var imageWidth: Int? = null,
    @Column(name = "image_height") var imageHeight: Int? = null,
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pin_tags", joinColumns = [JoinColumn(name = "pin_id")])
    @Column(name = "tag")
    var tags: MutableSet<String> = linkedSetOf(),
    @OneToMany(mappedBy = "pin", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("createdAt ASC")
    var comments: MutableList<PinCommentEntity> = mutableListOf(),
)
