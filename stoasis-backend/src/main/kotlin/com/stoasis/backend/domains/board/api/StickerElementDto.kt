package com.stoasis.backend.domains.board.api

data class StickerElementDto(
    val id: String,
    val type: String = "sticker",
    val motif: String,
    val colorVariant: String,
    val x: Double,
    val y: Double,
    val widthClips: Double,
    val heightClips: Double,
    val rotation: Double,
    val layer: Int,
)

