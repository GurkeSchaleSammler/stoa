package com.stoasis.backend.domains.upload.api

data class UploadResponse(
    val fileKey: String,
    val imageUrl: String,
    val width: Int,
    val height: Int,
    val originalName: String,
)
