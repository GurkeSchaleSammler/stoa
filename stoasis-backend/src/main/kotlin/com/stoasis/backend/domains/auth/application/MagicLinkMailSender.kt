package com.stoasis.backend.domains.auth.application

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.time.Duration
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.MailSendException
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service
import tools.jackson.databind.ObjectMapper

@Service
class MagicLinkMailSender(
    private val mailSender: JavaMailSender,
    private val objectMapper: ObjectMapper,
    @Value("\${stoasis.auth.frontend-base-url}") private val frontendBaseUrl: String,
    @Value("\${stoasis.auth.mail-from}") private val mailFrom: String,
    @Value("\${stoasis.auth.mail-provider:smtp}") private val mailProvider: String,
    @Value("\${stoasis.auth.resend-api-key:}") private val resendApiKey: String,
    @Value("\${stoasis.auth.resend-api-url:https://api.resend.com/emails}") private val resendApiUrl: String,
) {
    private val httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build()

    fun send(recipient: String, token: String) {
        val link = "${frontendBaseUrl.trimEnd('/')}/auth/verify?token=$token"
        val subject = "Dein Stoasis Magic Link"
        val text = """
            Hallo,

            öffne diesen Link, um dich bei Stoasis anzumelden:

            $link

            Der Link ist 15 Minuten gültig und kann nur einmal verwendet werden.
            Falls du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.

            Stoasis
        """.trimIndent()
        when (mailProvider.trim().lowercase()) {
            "smtp" -> sendWithSmtp(recipient, subject, text)
            "resend" -> sendWithResend(recipient, subject, text)
            else -> throw MailSendException("Unsupported Stoasis mail provider: $mailProvider")
        }
    }

    private fun sendWithSmtp(recipient: String, subject: String, text: String) {
        val message = SimpleMailMessage().apply {
            from = mailFrom
            setTo(recipient)
            this.subject = subject
            this.text = text
        }
        mailSender.send(message)
    }

    private fun sendWithResend(recipient: String, subject: String, text: String) {
        if (resendApiKey.isBlank()) {
            throw MailSendException("RESEND_API_KEY is required when STOASIS_MAIL_PROVIDER=resend.")
        }
        val payload = objectMapper.writeValueAsString(
            ResendEmailRequest(
                from = mailFrom,
                to = listOf(recipient),
                subject = subject,
                text = text,
            ),
        )
        val request = HttpRequest.newBuilder(URI.create(resendApiUrl))
            .timeout(Duration.ofSeconds(10))
            .header("Authorization", "Bearer $resendApiKey")
            .header("Content-Type", "application/json")
            .header("User-Agent", "stoasis-backend/0.0.1")
            .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
            .build()
        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
        if (response.statusCode() !in 200..299) {
            throw MailSendException("Resend email request failed with status ${response.statusCode()}: ${response.body().take(500)}")
        }
    }

    private data class ResendEmailRequest(
        val from: String,
        val to: List<String>,
        val subject: String,
        val text: String,
    )
}
