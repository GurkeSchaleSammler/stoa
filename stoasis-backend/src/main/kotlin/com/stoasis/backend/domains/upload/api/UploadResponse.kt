package com.stoasis.backend.domains.upload.api

/** Returns validated image dimensions and preview addresses. */
data class UploadResponse(
    val fileKey: String,
    val imageUrl: String,
    val width: Int,
    val height: Int,
    val originalName: String,
    val mimeType: String,
    val thumbnailUrl: String,
)
