package com.stoasis.backend.shared.security

import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class CurrentUser {
    fun principal(): StoasisPrincipal =
        SecurityContextHolder.getContext().authentication?.principal as? StoasisPrincipal
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "Nicht angemeldet.")

    fun id(): String = principal().id
}
