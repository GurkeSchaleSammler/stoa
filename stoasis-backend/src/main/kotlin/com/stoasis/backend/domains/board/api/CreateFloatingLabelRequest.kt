package com.stoasis.backend.domains.board.api

data class CreateFloatingLabelRequest(
    val x: Int,
    val y: Int,
    val widthClips: Int = 4,
    val text: String,
    val layer: Int,
)

