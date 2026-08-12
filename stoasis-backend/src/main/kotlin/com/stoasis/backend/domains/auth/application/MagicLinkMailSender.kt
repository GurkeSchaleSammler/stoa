package com.stoasis.backend.domains.auth.application

import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service

@Service
class MagicLinkMailSender(
    private val mailSender: JavaMailSender,
    @Value("\${stoasis.auth.frontend-base-url}") private val frontendBaseUrl: String,
    @Value("\${stoasis.auth.mail-from}") private val mailFrom: String,
) {
    fun send(recipient: String, token: String) {
        val link = "${frontendBaseUrl.trimEnd('/')}/auth/verify?token=$token"
        val message = SimpleMailMessage().apply {
            from = mailFrom
            setTo(recipient)
            subject = "Dein Stoasis Magic Link"
            text = """
                Hallo,

                öffne diesen Link, um dich bei Stoasis anzumelden:

                $link

                Der Link ist 15 Minuten gültig und kann nur einmal verwendet werden.
                Falls du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.

                Stoasis
            """.trimIndent()
        }
        mailSender.send(message)
    }
}
