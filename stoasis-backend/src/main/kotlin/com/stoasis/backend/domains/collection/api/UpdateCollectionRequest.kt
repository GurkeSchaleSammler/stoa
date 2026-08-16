package com.stoasis.backend.domains.collection.api

import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.collection.model.Visibility

data class UpdateCollectionRequest(
    val name: String? = null,
    val emoji: String? = null,
    val allowedTypes: Set<PinType>? = null,
    val visibility: Visibility? = null,
)
