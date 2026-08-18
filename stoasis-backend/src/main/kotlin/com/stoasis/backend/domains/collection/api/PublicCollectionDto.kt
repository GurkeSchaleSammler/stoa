package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.model.BoardKind
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Visibility
import java.time.Instant

data class PublicCollectionDto(
    val id: String,
    val name: String,
    val emoji: String,
    val allowedTypes: Set<PinType>,
    val visibility: Visibility,
    val pinCount: Long,
    val updatedAt: Instant,
    val boardKind: BoardKind?,
)

