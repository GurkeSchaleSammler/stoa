package com.stoasis.backend.domains.search.data

import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.collection.data.CollectionMemberEntity
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Visibility
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.skill.data.SkillDataEntity
import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Predicate
import jakarta.persistence.criteria.Root
import org.springframework.data.jpa.domain.Specification

/** Filters visible pins in the database before pagination and DTO loading. */
object PinSearch {
    fun matching(userId: String, text: String, type: PinType?, tags: List<String>, mode: String, collectionId: String?) =
        Specification<PinEntity> { pin, query, cb ->
            val board = pin.get<CollectionEntity>("collection")
            val predicates = mutableListOf(visible(userId, pin, query, cb))
            if (type != null) predicates.add(cb.equal(pin.get<PinType>("type"), type))
            if (collectionId != null) predicates.add(cb.equal(board.get<String>("id"), collectionId))
            if (text.isNotBlank()) predicates.add(text(pin, query, cb, text))
            val tagPredicates = tags.map { tag(pin, query, cb, it, false) }.toTypedArray()
            if (tags.isNotEmpty()) predicates.add(if (mode == "any") cb.or(*tagPredicates) else cb.and(*tagPredicates))
            cb.and(*predicates.toTypedArray())
        }

    private fun visible(userId: String, pin: Root<PinEntity>, query: CriteriaQuery<*>, cb: CriteriaBuilder): Predicate {
        val membership = query.subquery(Int::class.java)
        val member = membership.from(CollectionMemberEntity::class.java)
        membership.select(cb.literal(1)).where(
            cb.equal(member.get<CollectionEntity>("collection"), pin.get<CollectionEntity>("collection")),
            cb.equal(member.get<com.stoasis.backend.domains.auth.data.UserEntity>("user").get<String>("id"), userId),
        )
        return cb.or(cb.exists(membership), cb.equal(pin.get<CollectionEntity>("collection").get<Visibility>("visibility"), Visibility.public))
    }

    private fun text(pin: Root<PinEntity>, query: CriteriaQuery<*>, cb: CriteriaBuilder, value: String): Predicate {
        val pattern = "%${value.lowercase().replace("!", "!!").replace("%", "!%").replace("_", "!_")}%"
        val fields = listOf("title", "description", "content", "url", "caption", "siteName")
            .map { cb.like(cb.lower(pin.get(it)), pattern, '!') }
        val skill = query.subquery(Int::class.java)
        val data = skill.from(SkillDataEntity::class.java)
        skill.select(cb.literal(1)).where(cb.equal(data.get<String>("pinId"), pin.get<String>("id")), cb.like(cb.lower(data.get("skillName")), pattern, '!'))
        return cb.or(*(fields + cb.exists(skill) + tag(pin, query, cb, pattern, true)).toTypedArray())
    }

    private fun tag(pin: Root<PinEntity>, query: CriteriaQuery<*>, cb: CriteriaBuilder, value: String, pattern: Boolean): Predicate {
        val subquery = query.subquery(Int::class.java)
        val item = subquery.from(PinEntity::class.java)
        val name = cb.lower(item.joinSet<PinEntity, String>("tags"))
        subquery.select(cb.literal(1)).where(cb.equal(item.get<String>("id"), pin.get<String>("id")),
            if (pattern) cb.like(name, value, '!') else cb.equal(name, value))
        return cb.exists(subquery)
    }
}
