package com.stoasis.backend.domains.board.api

data class CreateStickerRequest(
    val motif: String,
    val colorVariant: String,
    val x: Double,
    val y: Double,
    val widthClips: Double = 4.0,
    val heightClips: Double = 4.0,
    val rotation: Double = 0.0,
    val layer: Int,
)

