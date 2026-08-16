package com.stoasis.backend.shared.security

import java.net.URI

data class SafeHttpResponse(
    val uri: URI,
    val status: Int,
    val headers: Map<String, String>,
    val body: ByteArray,
)
