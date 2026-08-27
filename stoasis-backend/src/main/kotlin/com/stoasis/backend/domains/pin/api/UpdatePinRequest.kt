package com.stoasis.backend.domains.pin.api

import tools.jackson.databind.JsonNode

data class UpdatePinRequest(
    val data: JsonNode? = null,
    val color: String? = null,
    val tags: Set<String>? = null,
    val sortOrder: Int? = null,
    val grid: UpdateGridBlockRequest? = null,
)
