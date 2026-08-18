package com.stoasis.backend.domains.group.model

import com.stoasis.backend.domains.collection.model.BoardKind

enum class SharingPreference {
    NONE,
    WORK_ONLY,
    PERSONAL_ONLY,
    BOTH;

    fun boardKinds(): Set<BoardKind> = when (this) {
        NONE -> emptySet()
        WORK_ONLY -> setOf(BoardKind.WORK)
        PERSONAL_ONLY -> setOf(BoardKind.PERSONAL)
        BOTH -> BoardKind.entries.toSet()
    }
}

