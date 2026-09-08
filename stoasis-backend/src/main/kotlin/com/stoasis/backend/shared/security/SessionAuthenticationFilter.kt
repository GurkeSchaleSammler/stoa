package com.stoasis.backend.shared.security

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.mcp.application.MCP_SESSION_VERSION
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

const val SESSION_USER_ID = "stoasis.user-id"

/** Authenticates sessions and checks MCP revocation on every request. */
@Component
class SessionAuthenticationFilter(
    private val users: UserRepository,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val userId = request.getSession(false)?.getAttribute(SESSION_USER_ID) as? String
        if (userId != null) {
            users.findById(userId).orElse(null)?.let { user ->
                val version = request.getSession(false)?.getAttribute(MCP_SESSION_VERSION)
                if (version != null && (version != user.mcpVersion || user.plan != "premium")) {
                    response.status = HttpServletResponse.SC_UNAUTHORIZED
                    response.contentType = "application/json"
                    response.writer.write("""{"message":"MCP-Zugriff widerrufen oder Premium erforderlich."}""")
                    return
                }
                val principal = StoasisPrincipal(user.id, user.email, user.name)
                SecurityContextHolder.getContext().authentication = UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    listOf(SimpleGrantedAuthority("ROLE_USER")),
                )
            }
        }
        filterChain.doFilter(request, response)
    }
}
