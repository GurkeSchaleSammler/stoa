package com.stoasis.backend.domains.plan.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

/** Provides account limits and serializes capacity checks for new content. */
@Service
class PlanService(private val users: UserRepository, private val pins: PinRepository) {
    fun limits(userId: String) = if (users.getReferenceById(userId).plan == "premium") PREMIUM else FREE

    fun lock(userId: String) = users.lockById(userId)
        ?: throw ApiException(HttpStatus.NOT_FOUND, "Nutzer nicht gefunden.")

    fun requirePremium(userId: String) {
        if (!limits(userId).premium) throw ApiException(HttpStatus.FORBIDDEN, "Premium erforderlich.")
    }

    fun requirePinCapacity(userId: String, type: PinType) {
        if (type != PinType.photo && type != PinType.skill) return
        lock(userId)
        val limit = if (type == PinType.photo) limits(userId).photos else limits(userId).skills
        if (pins.countByCreatedByIdAndType(userId, type) >= limit) {
            val label = if (type == PinType.photo) "Foto" else "Skill"
            throw ApiException(HttpStatus.CONFLICT, "$label-Limit erreicht ($limit). Bestehende Pins bleiben verfügbar.")
        }
    }

    companion object {
        val FREE = PlanLimits(false, 2, 3, 50, 5 * 1024 * 1024, 12, 100, 1600, 1, 5)
        val PREMIUM = PlanLimits(true, 25, 25, 2000, 20 * 1024 * 1024, 10000, 10000, 3200, 1000, 10000)
    }
}

/** Defines capacities without restricting access to existing content. */
data class PlanLimits(
    val premium: Boolean,
    val sharedBoards: Int,
    val members: Int,
    val photos: Int,
    val imageBytes: Int,
    val skills: Int,
    val importRows: Int,
    val previewDimension: Int,
    val worlds: Int,
    val worldBoards: Int,
)
