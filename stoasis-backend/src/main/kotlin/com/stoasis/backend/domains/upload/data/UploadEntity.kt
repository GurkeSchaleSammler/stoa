package com.stoasis.backend.domains.upload.data

import com.stoasis.backend.domains.auth.data.UserEntity
import jakarta.persistence.Basic
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

/** Stores upload ownership, metadata and legacy image bytes. */
@Entity
@Table(name = "uploads")
class UploadEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_id", nullable = false)
    var owner: UserEntity? = null,
    @Column(name = "original_name", nullable = false) var originalName: String = "",
    @Column(name = "content_type", nullable = false) var contentType: String = "",
    @Basic(fetch = FetchType.LAZY) @Column(nullable = false, columnDefinition = "BYTEA")
    var content: ByteArray = byteArrayOf(),
    @Basic(fetch = FetchType.LAZY) @Column(columnDefinition = "BYTEA")
    var thumbnail: ByteArray? = null,
    @Column(name = "image_width", nullable = false) var imageWidth: Int = 0,
    @Column(name = "image_height", nullable = false) var imageHeight: Int = 0,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
)
