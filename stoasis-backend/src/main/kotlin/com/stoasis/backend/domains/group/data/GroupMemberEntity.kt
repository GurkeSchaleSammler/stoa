package com.stoasis.backend.domains.group.data

import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.group.model.SharingPreference
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.Table
import java.io.Serializable
import java.time.Instant

@Embeddable
data class GroupMemberId(
    @Column(name = "group_id") var groupId: String = "",
    @Column(name = "user_id") var userId: String = "",
) : Serializable

@Entity
@Table(name = "group_members")
class GroupMemberEntity(
    @EmbeddedId var id: GroupMemberId = GroupMemberId(),
    @ManyToOne(fetch = FetchType.LAZY) @MapsId("groupId")
    @JoinColumn(name = "group_id", nullable = false)
    var group: GroupEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY) @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    var user: UserEntity? = null,
    @Enumerated(EnumType.STRING) @Column(name = "sharing_preference", nullable = false)
    var sharingPreference: SharingPreference = SharingPreference.NONE,
    @Column(name = "joined_at", nullable = false) var joinedAt: Instant = Instant.now(),
)

