package com.stoasis.backend.shared.web

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfiguration {
    @Bean
    fun stoasisOpenApi(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("Stoasis HTTP API")
                .version("1")
                .description(
                    "Runtime-generated API contract. Browser authentication uses the HttpOnly " +
                        "stoasis_session cookie. Error response details are documented on each operation.",
                ),
        )
        .components(
            Components().addSecuritySchemes(
                "sessionCookie",
                SecurityScheme()
                    .type(SecurityScheme.Type.APIKEY)
                    .`in`(SecurityScheme.In.COOKIE)
                    .name("stoasis_session"),
            ),
        )
}
