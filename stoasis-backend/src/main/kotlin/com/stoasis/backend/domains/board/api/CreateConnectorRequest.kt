package com.stoasis.backend.domains.board.api

data class CreateConnectorRequest(
    val sourcePinId: String,
    val targetPinId: String,
    val colorVariant: String = "accent",
)

