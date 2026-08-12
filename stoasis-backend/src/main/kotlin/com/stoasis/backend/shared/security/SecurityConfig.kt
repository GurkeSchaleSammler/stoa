package com.stoasis.backend.shared.security

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.shared.web.ApiError
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.MediaType
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.stereotype.Component
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.OncePerRequestFilter
import tools.jackson.databind.ObjectMapper

const val SESSION_USER_ID = "stoasis.user-id"

data class StoasisPrincipal(val id: String, val email: String, val name: String)

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

@Configuration
class SecurityConfig(
    private val sessionAuthenticationFilter: SessionAuthenticationFilter,
    private val objectMapper: ObjectMapper,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain = http
        .cors { it.configurationSource(corsConfigurationSource()) }
        .csrf { it.disable() }
        .headers { headers -> headers.frameOptions { it.sameOrigin() } }
        .sessionManagement {
            it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            it.sessionFixation { fixation -> fixation.none() }
        }
        .authorizeHttpRequests {
            it.requestMatchers(
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/magic-link",
                "/api/auth/verify",
                "/actuator/health",
                "/h2-console/**",
            ).permitAll()
            it.requestMatchers(HttpMethod.GET, "/api/uploads/**").permitAll()
            it.anyRequest().authenticated()
        }
        .exceptionHandling {
            it.authenticationEntryPoint { _, response, _ ->
                response.status = HttpServletResponse.SC_UNAUTHORIZED
                response.contentType = MediaType.APPLICATION_JSON_VALUE
                objectMapper.writeValue(response.outputStream, ApiError("Nicht angemeldet."))
            }
            it.accessDeniedHandler { _, response, _ ->
                response.status = HttpServletResponse.SC_FORBIDDEN
                response.contentType = MediaType.APPLICATION_JSON_VALUE
                objectMapper.writeValue(response.outputStream, ApiError("Kein Zugriff."))
            }
        }
        .addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
        .build()

    @Bean
    fun passwordEncoder(): PasswordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOrigins = listOf("http://localhost:4200", "http://127.0.0.1:4200")
            allowedMethods = listOf("GET", "POST", "PATCH", "DELETE", "OPTIONS")
            allowedHeaders = listOf("Content-Type", "X-File-Name", "Accept")
            allowCredentials = true
            maxAge = 3600
        }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }
}
