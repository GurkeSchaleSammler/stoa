package com.stoasis.backend.domains.group.data

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "group_entities")
class GroupEntity(
    @Id var id: String = "",
    @Column(nullable = false) var name: String = "",
    @Column(name = "owner_id", nullable = false) var ownerId: String = "",
    @Column(name = "invite_token") var inviteToken: String? = null,
    @Column(name = "created_at", nullable = false) var createdAt: Instant = Instant.now(),
    @OneToMany(mappedBy = "group", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var members: MutableSet<GroupMemberEntity> = linkedSetOf(),
)

