package com.stoasis.backend.domains.board.api

data class BoardElementsDto(
    val stacks: List<StackBlockDto>,
    val connectors: List<ConnectorThreadDto>,
    val zones: List<SoftZoneDto>,
    val labels: List<FloatingLabelDto>,
    val stickers: List<StickerElementDto>,
)

