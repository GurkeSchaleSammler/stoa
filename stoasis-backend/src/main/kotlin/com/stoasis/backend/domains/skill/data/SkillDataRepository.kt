package com.stoasis.backend.domains.skill.data

import org.springframework.data.jpa.repository.JpaRepository

interface SkillDataRepository : JpaRepository<SkillDataEntity, String> {
    fun findAllByPinIdIn(pinIds: Collection<String>): List<SkillDataEntity>
}

