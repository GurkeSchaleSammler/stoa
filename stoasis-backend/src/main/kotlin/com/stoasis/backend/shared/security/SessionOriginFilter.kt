package com.stoasis.backend.shared.security

import com.stoasis.backend.shared.web.ApiError
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import tools.jackson.databind.ObjectMapper

/** Rejects cross-site state changes made with an authenticated browser session. */
@Component
@Profile("prod")
class SessionOriginFilter(
    @Value("\${stoasis.cors.allowed-origins}") allowedOrigins: String,
    private val objectMapper: ObjectMapper,
) : OncePerRequestFilter() {
    private val trustedOrigins = allowedOrigins.split(',').map(String::trim).filter(String::isNotEmpty).toSet()

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val changesState = request.method !in setOf(
            HttpMethod.GET.name(), HttpMethod.HEAD.name(), HttpMethod.OPTIONS.name(), HttpMethod.TRACE.name(),
        )
        val hasSession = request.getSession(false) != null
        if (changesState && hasSession && isUntrustedBrowserRequest(request)) {
            response.status = HttpServletResponse.SC_FORBIDDEN
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            objectMapper.writeValue(
                response.outputStream,
                ApiError("Ungültiger Herkunftsursprung.", "security.origin_rejected"),
            )
            return
        }

        filterChain.doFilter(request, response)
    }

    private fun isUntrustedBrowserRequest(request: HttpServletRequest): Boolean {
        val origin = request.getHeader("Origin")
        if (origin != null) return origin !in trustedOrigins

        val fetchSite = request.getHeader("Sec-Fetch-Site")
        if (fetchSite != null) return fetchSite != "same-origin"

        // Server-to-server clients such as stoasis-mcp send neither browser header.
        return false
    }
}
