package com.stoasis.backend.domains.upload.application

import java.nio.file.Files
import java.nio.file.Path
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager

/** Stores production images on a mounted durable volume and reads legacy database images. */
@Component
class UploadStorage(@Value("\${stoasis.upload.directory:}") private val directory: String) {
    fun write(key: String, content: ByteArray): ByteArray {
        if (directory.isBlank()) return content
        val path = path(key)
        Files.createDirectories(path.parent)
        Files.write(path, content, java.nio.file.StandardOpenOption.CREATE_NEW)
        TransactionSynchronizationManager.registerSynchronization(object : TransactionSynchronization {
            override fun afterCompletion(status: Int) {
                if (status != TransactionSynchronization.STATUS_COMMITTED) Files.deleteIfExists(path)
            }
        })
        return byteArrayOf()
    }

    fun read(key: String, content: ByteArray): ByteArray =
        if (content.isNotEmpty()) content else Files.readAllBytes(path(key))

    fun deleteAfterCommit(key: String) {
        if (directory.isBlank()) return
        TransactionSynchronizationManager.registerSynchronization(object : TransactionSynchronization {
            override fun afterCommit() {
                Files.deleteIfExists(path(key))
                Files.deleteIfExists(path("$key-thumb"))
            }
        })
    }

    private fun path(key: String): Path {
        require(key.matches(Regex("upload-[a-f0-9-]+(?:-thumb)?")))
        return Path.of(directory).resolve(key)
    }
}
