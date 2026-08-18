package com.stoasis.backend.domains.skill.data

import com.stoasis.backend.domains.skill.model.SkillLevel
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "skill_data")
class SkillDataEntity(
    @Id @Column(name = "pin_id") var pinId: String = "",
    @Column(name = "skill_name", nullable = false) var skillName: String = "",
    @Enumerated(EnumType.STRING) @Column(nullable = false) var level: SkillLevel = SkillLevel.BEGINNER,
    @Column(name = "years_experience") var yearsExperience: Short? = null,
)
