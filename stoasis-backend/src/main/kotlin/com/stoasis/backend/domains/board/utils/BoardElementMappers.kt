package com.stoasis.backend.domains.board.utils

import com.stoasis.backend.domains.board.api.ConnectorThreadDto
import com.stoasis.backend.domains.board.api.FloatingLabelDto
import com.stoasis.backend.domains.board.api.SoftZoneDto
import com.stoasis.backend.domains.board.api.StackBlockDto
import com.stoasis.backend.domains.board.api.StickerElementDto
import com.stoasis.backend.domains.board.data.BoardConnectorEntity
import com.stoasis.backend.domains.board.data.FloatingLabelEntity
import com.stoasis.backend.domains.board.data.PinStackEntity
import com.stoasis.backend.domains.board.data.SoftZoneEntity
import com.stoasis.backend.domains.board.data.StickerEntity

fun PinStackEntity.toDto() = StackBlockDto(
    id = id,
    x = gridX,
    y = gridY,
    heightClips = heightClips,
    layer = layer,
    children = children.mapNotNull { it.pin?.id },
    expanded = expanded,
)

fun BoardConnectorEntity.toDto() = ConnectorThreadDto(
    id = id,
    sourcePinId = sourcePin?.id.orEmpty(),
    targetPinId = targetPin?.id.orEmpty(),
    label = label,
    colorVariant = colorVariant,
)

fun SoftZoneEntity.toDto() = SoftZoneDto(
    id = id,
    x = gridX,
    y = gridY,
    widthClips = widthClips,
    heightClips = heightClips,
    colorVariant = colorVariant,
    label = label,
)

fun FloatingLabelEntity.toDto() = FloatingLabelDto(
    id = id,
    x = gridX,
    y = gridY,
    widthClips = widthClips,
    text = text,
    layer = layer,
)

fun StickerEntity.toDto() = StickerElementDto(
    id = id,
    motif = motif,
    colorVariant = colorVariant,
    x = positionX,
    y = positionY,
    widthClips = widthClips,
    heightClips = heightClips,
    rotation = rotation,
    layer = layer,
)
