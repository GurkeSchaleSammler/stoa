package com.stoasis.backend.domains.board.utils

import com.stoasis.backend.domains.board.application.BoardElementService.Companion.CLIP_SIZE_PX
import com.stoasis.backend.domains.board.model.BoardRect
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_HEIGHT_CLIPS
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_WIDTH_CLIPS
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus

fun overlapAllowed(a: BoardRect, b: BoardRect): Boolean {
    val width = (minOf(a.x + a.width, b.x + b.width) - maxOf(a.x, b.x)).coerceAtLeast(0)
    val height = (minOf(a.y + a.height, b.y + b.height) - maxOf(a.y, b.y)).coerceAtLeast(0)
    return width * height * 2 <= minOf(a.width * a.height, b.width * b.height)
}

fun requireGridBounds(x: Int, y: Int, height: Int, width: Int) {
    if (height !in 1..BOARD_HEIGHT_CLIPS || x !in 0..(BOARD_WIDTH_CLIPS - width) ||
        y !in 0..(BOARD_HEIGHT_CLIPS - height)
    ) {
        badRequest("Das Element liegt ausserhalb des Boards.")
    }
}

fun requireZoneBounds(x: Int, y: Int, width: Int, height: Int) {
    if (width < 2 || height < 2 || x < 0 || y < 0 || x + width > BOARD_WIDTH_CLIPS ||
        y + height > BOARD_HEIGHT_CLIPS
    ) {
        badRequest("Ungültige Zonengrösse oder -position.")
    }
}

fun requireLabelBounds(x: Int, y: Int, width: Int) {
    if (width !in 2..6 || x < 0 || y < 0 || x + width > BOARD_WIDTH_CLIPS || y >= BOARD_HEIGHT_CLIPS) {
        badRequest("Ungültige Annotation.")
    }
}

fun requireStickerGeometry(x: Double, y: Double, width: Double, height: Double, rotation: Double) {
    val boardWidth = BOARD_WIDTH_CLIPS * CLIP_SIZE_PX
    val boardHeight = BOARD_HEIGHT_CLIPS * CLIP_SIZE_PX
    if (!x.isFinite() || !y.isFinite() || !width.isFinite() || !height.isFinite() || !rotation.isFinite() ||
        width !in 2.0..8.0 || height !in 2.0..8.0 || rotation !in -15.0..15.0 ||
        x < 0 || y < 0 || x + width * CLIP_SIZE_PX > boardWidth ||
        y + height * CLIP_SIZE_PX > boardHeight
    ) {
        badRequest("Ungültige Sticker-Geometrie.")
    }
}

fun overlapError(): Nothing =
    throw ApiException(HttpStatus.CONFLICT, "Karten dürfen sich höchstens zur Hälfte überlagern.")

fun badRequest(message: String): Nothing = throw ApiException(HttpStatus.BAD_REQUEST, message)
