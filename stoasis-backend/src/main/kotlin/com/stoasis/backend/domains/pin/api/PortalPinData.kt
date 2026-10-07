package com.stoasis.backend.domains.pin.api

data class PortalPinData(
    val worldId: String?,
    val targetCollectionId: String?,
    val targetName: String?,
    val targetEmoji: String?,
    val label: String,
    val emoji: String,
    val available: Boolean,
) : PinData
