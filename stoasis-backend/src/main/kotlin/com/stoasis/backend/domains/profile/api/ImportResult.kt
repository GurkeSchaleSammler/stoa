package com.stoasis.backend.domains.profile.api


data class ImportResult(val imported: Int, val skipped: Int, val errors: List<String>)
