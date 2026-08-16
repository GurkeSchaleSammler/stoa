package com.stoasis.backend.domains.board.api

data class CreateSoftZoneRequest(
    val x: Int,
    val y: Int,
    val widthClips: Int,
    val heightClips: Int,
    val colorVariant: String = "sage",
    val label: String? = null,
)

