package com.stoasis.backend.domains.board.api

data class UpdateStackRequest(
    val x: Int? = null,
    val y: Int? = null,
    val layer: Int? = null,
    val expanded: Boolean? = null,
)

