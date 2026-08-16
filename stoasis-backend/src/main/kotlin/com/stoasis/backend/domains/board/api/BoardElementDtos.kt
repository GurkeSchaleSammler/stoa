package com.stoasis.backend.domains.board.api

data class BoardElementsDto(
    val stacks: List<StackBlockDto>,
    val connectors: List<ConnectorThreadDto>,
    val zones: List<SoftZoneDto>,
    val labels: List<FloatingLabelDto>,
    val stickers: List<StickerElementDto>,
)

data class StackBlockDto(
    val id: String,
    val type: String = "stack",
    val x: Int,
    val y: Int,
    val width: Int = 16,
    val heightClips: Int,
    val layer: Int,
    val children: List<String>,
    val expanded: Boolean,
)

data class ConnectorThreadDto(
    val id: String,
    val sourcePinId: String,
    val targetPinId: String,
    val colorVariant: String,
)

data class SoftZoneDto(
    val id: String,
    val type: String = "zone",
    val x: Int,
    val y: Int,
    val widthClips: Int,
    val heightClips: Int,
    val colorVariant: String,
    val label: String?,
)

data class FloatingLabelDto(
    val id: String,
    val type: String = "label",
    val x: Int,
    val y: Int,
    val widthClips: Int,
    val text: String,
    val layer: Int,
)

data class StickerElementDto(
    val id: String,
    val type: String = "sticker",
    val motif: String,
    val colorVariant: String,
    val x: Double,
    val y: Double,
    val widthClips: Double,
    val heightClips: Double,
    val rotation: Double,
    val layer: Int,
)

data class CreateStackRequest(val sourcePinId: String, val targetPinId: String)
data class UpdateStackRequest(
    val x: Int? = null,
    val y: Int? = null,
    val layer: Int? = null,
    val expanded: Boolean? = null,
)
data class ReleaseStackChildRequest(
    val pinId: String,
    val x: Int,
    val y: Int,
    val layer: Int,
)

data class CreateConnectorRequest(
    val sourcePinId: String,
    val targetPinId: String,
    val colorVariant: String = "accent",
)

data class CreateSoftZoneRequest(
    val x: Int,
    val y: Int,
    val widthClips: Int,
    val heightClips: Int,
    val colorVariant: String = "sage",
    val label: String? = null,
)
data class UpdateSoftZoneRequest(
    val x: Int? = null,
    val y: Int? = null,
    val widthClips: Int? = null,
    val heightClips: Int? = null,
    val colorVariant: String? = null,
    val label: String? = null,
)

data class CreateFloatingLabelRequest(
    val x: Int,
    val y: Int,
    val widthClips: Int = 4,
    val text: String,
    val layer: Int,
)
data class UpdateFloatingLabelRequest(
    val x: Int? = null,
    val y: Int? = null,
    val widthClips: Int? = null,
    val text: String? = null,
    val layer: Int? = null,
)

data class CreateStickerRequest(
    val motif: String,
    val colorVariant: String,
    val x: Double,
    val y: Double,
    val widthClips: Double = 4.0,
    val heightClips: Double = 4.0,
    val rotation: Double = 0.0,
    val layer: Int,
)
data class UpdateStickerRequest(
    val x: Double? = null,
    val y: Double? = null,
    val widthClips: Double? = null,
    val heightClips: Double? = null,
    val rotation: Double? = null,
    val layer: Int? = null,
    val motif: String? = null,
    val colorVariant: String? = null,
)
