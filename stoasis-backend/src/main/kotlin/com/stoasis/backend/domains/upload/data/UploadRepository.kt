package com.stoasis.backend.domains.upload.data

import org.springframework.data.jpa.repository.JpaRepository

interface UploadRepository : JpaRepository<UploadEntity, String>
