package com.stoasis.backend.domains.board.api

data class ConnectorThreadDto(
    val id: String,
    val sourcePinId: String,
    val targetPinId: String,
    val colorVariant: String,
)

