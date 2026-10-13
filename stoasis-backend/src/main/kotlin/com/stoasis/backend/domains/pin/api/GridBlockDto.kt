package com.stoasis.backend.domains.pin.api

import com.stoasis.backend.domains.collection.model.PinType

data class GridBlockDto(
    val id: String,
    val x: Int,
    val y: Int,
    val width: Int = 16,
    val heightClips: Int,
    val layer: Int,
    val contentType: PinType,
    val baseHeightClips: Int = heightClips,
    val manualSize: Boolean = false,
)
