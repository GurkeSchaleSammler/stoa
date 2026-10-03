package com.stoasis.backend.shared.security

import com.stoasis.backend.shared.web.ApiError
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.beans.factory.ObjectProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.MediaType
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import tools.jackson.databind.ObjectMapper

@Configuration
class SecurityConfig(
    private val sessionAuthenticationFilter: SessionAuthenticationFilter,
    private val sessionOriginFilter: ObjectProvider<SessionOriginFilter>,
    private val objectMapper: ObjectMapper,
    @Value("\${stoasis.cors.allowed-origins}") private val corsAllowedOrigins: String,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val chain = http
            .cors { it.configurationSource(corsConfigurationSource()) }
            // Cookie-authenticated mutations are protected by SessionOriginFilter.
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
                    "/v3/api-docs",
                    "/v3/api-docs.yaml",
                    "/v3/api-docs/**",
                    "/h2-console/**",
                ).permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/uploads/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/public/profile-boards/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/public/collections/**").permitAll()
                it.anyRequest().authenticated()
            }
            .exceptionHandling {
                it.authenticationEntryPoint { _, response, _ ->
                    response.status = HttpServletResponse.SC_UNAUTHORIZED
                    response.contentType = MediaType.APPLICATION_JSON_VALUE
                    objectMapper.writeValue(response.outputStream, ApiError("Nicht angemeldet.", "auth.required"))
                }
                it.accessDeniedHandler { _, response, _ ->
                    response.status = HttpServletResponse.SC_FORBIDDEN
                    response.contentType = MediaType.APPLICATION_JSON_VALUE
                    objectMapper.writeValue(response.outputStream, ApiError("Kein Zugriff.", "authorization.denied"))
                }
            }
        // Use the registered Spring Security anchor on both sides so production startup does
        // not depend on resolving the order of another custom filter.
        sessionOriginFilter.ifAvailable {
            chain.addFilterBefore(it, UsernamePasswordAuthenticationFilter::class.java)
        }
        chain.addFilterAfter(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
        return chain.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOrigins = corsAllowedOrigins.split(',').map(String::trim).filter(String::isNotEmpty)
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
