package com.stoasis.backend.domains.skill.api

import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.skill.model.SkillLevel
import com.stoasis.backend.domains.pin.api.GridBlockDto
import java.time.Instant

/** Describes a skill and its board position. */
data class ProfileSkillDto(
    val id: String,
    val skillName: String,
    val level: SkillLevel,
    val yearsExperience: Int?,
    val createdAt: Instant,
    val grid: GridBlockDto,
)

/** Presents one system profile board without exposing its invitation token publicly. */
data class ProfileBoardDto(
    val id: String,
    val name: String,
    val boardKind: BoardKind,
    val visibility: Visibility,
    val shareToken: String?,
    val skills: List<ProfileSkillDto>,
    val accent: String? = null,
    val ownerName: String = "",
    val ownerAvatarUrl: String? = null,
)
