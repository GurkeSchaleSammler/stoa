package com.stoasis.backend.domains.pin.api


data class PhotoPinData(
    val fileKey: String,
    val caption: String?,
    val width: Int,
    val height: Int,
    val imageUrl: String?,
) : PinData
