package com.stoasis.backend.domains.pin.api

import java.time.Instant

data class PinCommentDto(
    val authorId: String,
    val authorName: String,
    val authorAvatarUrl: String?,
    val body: String,
    val at: Instant,
)
