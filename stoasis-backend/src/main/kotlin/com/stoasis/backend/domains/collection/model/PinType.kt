package com.stoasis.backend.domains.collection.model

enum class PinType { link, note, photo, portal, skill }

fun Role.canEdit() = this == Role.owner || this == Role.editor
