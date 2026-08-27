package com.stoasis.backend.domains.pin.api

import com.stoasis.backend.domains.collection.model.PinType
import tools.jackson.databind.JsonNode

data class CreatePinRequest(
    val type: PinType,
    val data: JsonNode,
    val color: String? = null,
    val tags: Set<String> = emptySet(),
)
