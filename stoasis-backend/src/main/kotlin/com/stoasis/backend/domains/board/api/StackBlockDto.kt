package com.stoasis.backend.domains.board.api

data class StackBlockDto(
    val id: String,
    val type: String = "stack",
    val x: Int,
    val y: Int,
    val width: Int = 16,
    val heightClips: Int,
    val layer: Int,
    val children: List<String>,
    val expanded: Boolean,
)

