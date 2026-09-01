package com.stoasis.backend.domains.pin.api

data class NotePinData(
    val content: String,
    val color: String,
    val title: String? = null,
) : PinData
