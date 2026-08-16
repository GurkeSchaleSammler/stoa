package com.stoasis.backend.domains.board.api

data class UpdateFloatingLabelRequest(
    val x: Int? = null,
    val y: Int? = null,
    val widthClips: Int? = null,
    val text: String? = null,
    val layer: Int? = null,
)

