package com.stoasis.backend.domains.group.data

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface GroupEntityRepository : JpaRepository<GroupEntity, String> {
    @EntityGraph(attributePaths = ["members", "members.user"])
    @Query("select distinct g from GroupEntity g join g.members m where m.user.id = :userId")
    fun findAllForUser(@Param("userId") userId: String): List<GroupEntity>

    @EntityGraph(attributePaths = ["members", "members.user"])
    @Query("select distinct g from GroupEntity g where g.id = :id")
    fun findDetailedById(@Param("id") id: String): GroupEntity?

    @EntityGraph(attributePaths = ["members", "members.user"])
    fun findByInviteToken(inviteToken: String): GroupEntity?
}

interface GroupMemberRepository : JpaRepository<GroupMemberEntity, GroupMemberId> {
    @EntityGraph(attributePaths = ["group", "user"])
    @Query("select m from GroupMemberEntity m where m.group.id = :groupId and m.user.id = :userId")
    fun findMembership(@Param("groupId") groupId: String, @Param("userId") userId: String): GroupMemberEntity?
}

