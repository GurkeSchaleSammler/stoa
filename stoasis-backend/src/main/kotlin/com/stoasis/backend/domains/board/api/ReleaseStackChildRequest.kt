package com.stoasis.backend.domains.board.api

data class ReleaseStackChildRequest(
    val pinId: String,
    val x: Int,
    val y: Int,
    val layer: Int,
)

