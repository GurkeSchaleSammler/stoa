package com.stoasis.backend.domains.link.data

import jakarta.persistence.Basic
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "link_preview_images")
class LinkPreviewImageEntity(
    @Id var id: String = "",
    @Column(name = "source_url", nullable = false, length = 4096) var sourceUrl: String = "",
    @Column(name = "content_type", nullable = false) var contentType: String = "image/jpeg",
    @Basic(fetch = FetchType.LAZY) @Column(nullable = false, columnDefinition = "BYTEA")
    var content: ByteArray = byteArrayOf(),
    @Column(name = "image_width", nullable = false) var imageWidth: Int = 0,
    @Column(name = "image_height", nullable = false) var imageHeight: Int = 0,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
)
