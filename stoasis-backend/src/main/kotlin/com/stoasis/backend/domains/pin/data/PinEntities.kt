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
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import java.time.Instant
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

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
    @Column(nullable = false) var layer: Int = 0,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    var url: String? = null,
    var title: String? = null,
    @Column(columnDefinition = "CLOB") var description: String? = null,
    @Column(name = "image_url") var imageUrl: String? = null,
    @Column(name = "site_name") var siteName: String? = null,
    @Column(name = "reading_time_min") var readingTimeMin: Int? = null,
    @Column(name = "parse_status") var parseStatus: String? = null,
    @Column(columnDefinition = "CLOB") var content: String? = null,
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

@Entity
@Table(name = "pin_comments")
class PinCommentEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "pin_id", nullable = false)
    var pin: PinEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "author_id", nullable = false)
    var author: UserEntity? = null,
    @Column(nullable = false, columnDefinition = "CLOB") var body: String = "",
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
)

interface PinRepository : JpaRepository<PinEntity, String> {
    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection"])
    fun findAllByCollectionIdOrderBySortOrder(collectionId: String): List<PinEntity>

    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection"])
    @Query("select p from PinEntity p where p.id = :id and p.collection.id = :collectionId")
    fun findDetailed(@Param("collectionId") collectionId: String, @Param("id") id: String): PinEntity?

    @EntityGraph(attributePaths = ["createdBy", "comments", "comments.author", "tags", "collection"])
    @Query("select distinct p from PinEntity p join p.collection c join c.members m where m.user.id = :userId")
    fun findAllVisibleTo(@Param("userId") userId: String): List<PinEntity>

    fun countByCollectionId(collectionId: String): Long
    fun deleteAllByCollectionId(collectionId: String)
}

interface PinCommentRepository : JpaRepository<PinCommentEntity, Long>
