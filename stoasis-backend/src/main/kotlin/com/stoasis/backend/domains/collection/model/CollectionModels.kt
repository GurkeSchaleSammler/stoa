package com.stoasis.backend.domains.collection.model

enum class Role { owner, editor, viewer }
enum class Visibility { private, link }
enum class PinType { link, note, photo }

fun Role.canEdit() = this == Role.owner || this == Role.editor
