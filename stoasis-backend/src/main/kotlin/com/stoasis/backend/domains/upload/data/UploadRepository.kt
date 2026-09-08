package com.stoasis.backend.domains.upload.data

import java.time.Instant
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

/** Loads upload metadata and measures account storage usage. */
interface UploadRepository : JpaRepository<UploadEntity, String> {
    fun findAllByOwnerId(ownerId: String): List<UploadEntity>
    @Query("select u.id from UploadEntity u where u.owner.id = :ownerId and u.createdAt < :before")
    fun findKeysBefore(ownerId: String, before: Instant): List<String>

    fun countByOwnerId(ownerId: String): Long
}
