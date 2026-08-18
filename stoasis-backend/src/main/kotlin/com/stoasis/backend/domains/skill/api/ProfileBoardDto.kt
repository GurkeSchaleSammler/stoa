package com.stoasis.backend.domains.skill.api

import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.skill.model.SkillLevel
import com.stoasis.backend.domains.pin.api.GridBlockDto
import java.time.Instant

data class ProfileSkillDto(
    val id: String,
    val skillName: String,
    val level: SkillLevel,
    val yearsExperience: Int?,
    val createdAt: Instant,
    val grid: GridBlockDto,
)

data class ProfileBoardDto(
    val id: String,
    val name: String,
    val boardKind: BoardKind,
    val visibility: Visibility,
    val shareToken: String?,
    val skills: List<ProfileSkillDto>,
)
