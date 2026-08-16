package com.stoasis.backend.domains.pin.api

import jakarta.validation.constraints.NotBlank

data class AddCommentRequest(@field:NotBlank(message = "Kommentar darf nicht leer sein.") val body: String)
