package com.stoasis.backend.domains.stoaql.api

import org.springframework.http.HttpStatus

class StoaQlException(
    val status: HttpStatus,
    val code: String,
    override val message: String,
    val column: Int,
    val statementIndex: Int? = null,
    val hint: String? = null,
) : RuntimeException(message)
