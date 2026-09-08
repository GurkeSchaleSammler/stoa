package com.stoasis.backend.domains.membership.api

import com.stoasis.backend.domains.collection.model.Visibility

/** Returns invitation details and the owning account's capacity. */
data class InviteInfo(
    val collectionId: String,
    val token: String,
    val url: String,
    val visibility: Visibility,
    val collectionName: String,
    val alreadyMember: Boolean = false,
    val capacity: com.stoasis.backend.domains.membership.application.CollaborationCapacity,
)
