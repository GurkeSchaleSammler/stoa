package com.stoasis.backend.domains.board.api

data class UpdateSoftZoneRequest(
    val x: Int? = null,
    val y: Int? = null,
    val widthClips: Int? = null,
    val heightClips: Int? = null,
    val colorVariant: String? = null,
    val label: String? = null,
)

