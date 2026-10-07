package com.stoasis.backend.domains.collection.data

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "board_presence")
class BoardPresenceEntity(
    @Id var id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "member_id", nullable = false)
    var member: CollectionMemberEntity? = null,
    @Column(name = "client_id", nullable = false) var clientId: String = "",
    var x: Double? = null,
    var y: Double? = null,
    @Column(name = "seen_at", nullable = false) var seenAt: Instant = Instant.EPOCH,
)
