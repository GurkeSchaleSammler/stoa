package com.stoasis.backend.domains.board.api

data class SoftZoneDto(
    val id: String,
    val type: String = "zone",
    val x: Int,
    val y: Int,
    val widthClips: Int,
    val heightClips: Int,
    val colorVariant: String,
    val label: String?,
)

