package com.stoasis.backend.shared.id

import java.util.UUID
import org.springframework.stereotype.Component

fun interface IdGenerator {
    fun newId(): String
}

@Component
class UuidIdGenerator : IdGenerator {
    override fun newId(): String = UUID.randomUUID().toString()
}
