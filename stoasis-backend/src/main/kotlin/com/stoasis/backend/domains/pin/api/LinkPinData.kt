package com.stoasis.backend.domains.pin.api


data class LinkPinData(
    val url: String,
    val title: String,
    val description: String?,
    val imageUrl: String?,
    val siteName: String?,
    val readingTimeMin: Int?,
    val parseStatus: String,
) : PinData
