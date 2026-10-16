package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

/** Board owner funds collaboration. Serialize capacity checks on the board row. */
@Service
class BoardFeaturePolicy(private val collections: CollectionService, private val plans: PlanService) {
    fun editable(collectionId: String, userId: String): CollectionEntity = collections.lock(collectionId).also {
        collections.requireEdit(it, userId)
    }

    fun premium(board: CollectionEntity) = plans.limits(board.ownerId).premium

    fun requireCapacity(board: CollectionEntity, count: Long, limit: Int, code: String) {
        if (!premium(board) && count >= limit) throw ApiException(
            HttpStatus.CONFLICT, "Das Free-Limit für dieses Board ist erreicht. Premium ist unbegrenzt.", code = code,
        )
    }

    fun label(value: String): String = value.trim().also {
        if (it.length > 120) throw ApiException(HttpStatus.BAD_REQUEST, "Beschriftungen dürfen maximal 120 Zeichen haben.")
    }
}
