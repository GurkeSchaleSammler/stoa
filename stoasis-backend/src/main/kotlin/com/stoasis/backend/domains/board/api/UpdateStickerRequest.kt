package com.stoasis.backend.domains.board.api

data class UpdateStickerRequest(
    val x: Double? = null,
    val y: Double? = null,
    val widthClips: Double? = null,
    val heightClips: Double? = null,
    val rotation: Double? = null,
    val layer: Int? = null,
    val motif: String? = null,
    val colorVariant: String? = null,
)

