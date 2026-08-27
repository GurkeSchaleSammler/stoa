package com.stoasis.backend.domains.board.utils

import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.shared.utils.normalizeUiColor
import java.time.Instant
import java.util.UUID

private val stickerMotifs = setOf(
    "circle",
    "triangle",
    "moon",
    "blob",
    "star",
    "wave",
    "arrow",
    "leaf",
    "cloud",
    "drop",
    "compass",
    "suitcase",
    "camera",
)

fun validBoardColor(value: String): String = normalizeUiColor(value)
    ?: badRequest("Unbekannte Farbvariante.")

fun validStickerMotif(value: String): String = value.takeIf(stickerMotifs::contains)
    ?: badRequest("Unbekanntes Sticker-Motiv.")

fun requiredBoardText(value: String, maxLength: Int): String = value.trim().also {
    if (it.isBlank() || it.length > maxLength) badRequest("Text fehlt oder ist zu lang.")
}

fun cleanOptionalBoardText(value: String?, maxLength: Int): String? =
    value?.trim()?.takeIf(String::isNotBlank)?.also {
        if (it.length > maxLength) badRequest("Text ist zu lang.")
    }

fun boardElementId(prefix: String): String = "$prefix-${UUID.randomUUID().toString().take(8)}"

fun touchCollection(collection: CollectionEntity) {
    collection.updatedAt = Instant.now()
}
