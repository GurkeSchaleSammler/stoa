package com.stoasis.backend.shared.security

import com.stoasis.backend.domains.auth.data.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

const val SESSION_USER_ID = "stoasis.user-id"

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
        if (userId != null && SecurityContextHolder.getContext().authentication == null) {
            users.findById(userId).orElse(null)?.let { user ->
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
