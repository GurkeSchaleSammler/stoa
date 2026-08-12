package com.stoasis.backend

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration

@SpringBootApplication(exclude = [UserDetailsServiceAutoConfiguration::class])
class StoasisBackendApplication

fun main(args: Array<String>) {
    runApplication<StoasisBackendApplication>(*args)
}
