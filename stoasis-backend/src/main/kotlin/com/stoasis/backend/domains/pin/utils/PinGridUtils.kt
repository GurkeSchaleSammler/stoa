package com.stoasis.backend.domains.pin.utils

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_HEIGHT_CLIPS
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.application.PinService.Companion.CARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.model.PinGridRect
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus

private const val AUTO_LAYOUT_GAP_CLIPS = 2

fun estimatedPinHeight(pin: PinEntity): Int = when (pin.type) {
    PinType.link -> 18
    PinType.note -> (12 + ((pin.title.orEmpty().length + pin.content.orEmpty().length) / 38)).coerceIn(12, 28)
    PinType.photo -> {
        val ratio = if ((pin.imageWidth ?: 0) > 0) {
            (pin.imageHeight ?: 0).toDouble() / (pin.imageWidth ?: 1)
        } else {
            0.7
        }
        (8 + (CARD_WIDTH_CLIPS * ratio).toInt()).coerceIn(12, 30)
    }
    PinType.skill -> 12
}

fun findFreePinPosition(heightClips: Int, occupied: List<PinGridRect>): Pair<Int, Int> {
    for (y in 0..(BOARD_HEIGHT_CLIPS - heightClips) step AUTO_LAYOUT_GAP_CLIPS) {
        for (x in 0..(BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS) step (CARD_WIDTH_CLIPS + AUTO_LAYOUT_GAP_CLIPS)) {
            val candidate = PinGridRect(x, y, CARD_WIDTH_CLIPS, heightClips)
            if (occupied.none { pinIntersectionArea(candidate, it) > 0 }) return x to y
        }
    }
    throw ApiException(HttpStatus.CONFLICT, "Auf diesem Board ist kein freier Platz mehr verfügbar.")
}

fun pinOverlapAllowed(a: PinGridRect, b: PinGridRect): Boolean {
    val overlapArea = pinIntersectionArea(a, b)
    val smallerArea = minOf(a.width * a.height, b.width * b.height)
    return overlapArea * 2 <= smallerArea
}

fun pinIntersectionArea(a: PinGridRect, b: PinGridRect): Int {
    val width = (minOf(a.x + a.width, b.x + b.width) - maxOf(a.x, b.x)).coerceAtLeast(0)
    val height = (minOf(a.y + a.height, b.y + b.height) - maxOf(a.y, b.y)).coerceAtLeast(0)
    return width * height
}
