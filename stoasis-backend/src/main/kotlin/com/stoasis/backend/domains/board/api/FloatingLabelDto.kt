package com.stoasis.backend.domains.board.api

data class FloatingLabelDto(
    val id: String,
    val type: String = "label",
    val x: Int,
    val y: Int,
    val widthClips: Int,
    val text: String,
    val layer: Int,
)

