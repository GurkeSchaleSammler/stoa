package com.stoasis.backend.domains.pin.api

data class UpdateGridBlockRequest(
    val x: Int,
    val y: Int,
    val heightClips: Int,
    val layer: Int,
    val width: Int? = null,
    val manualSize: Boolean? = null,
)
