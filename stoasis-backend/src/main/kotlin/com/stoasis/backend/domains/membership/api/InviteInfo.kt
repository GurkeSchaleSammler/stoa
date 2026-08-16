package com.stoasis.backend.domains.membership.api

import com.stoasis.backend.domains.collection.model.Visibility

data class InviteInfo(
    val collectionId: String,
    val token: String,
    val url: String,
    val visibility: Visibility,
    val collectionName: String,
    val alreadyMember: Boolean = false,
)
