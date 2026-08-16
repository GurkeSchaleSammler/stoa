package com.stoasis.backend.domains.pin.data

import com.stoasis.backend.domains.auth.data.UserEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

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
