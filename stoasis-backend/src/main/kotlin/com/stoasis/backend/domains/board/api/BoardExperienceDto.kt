package com.stoasis.backend.domains.board.api

import java.time.LocalDate

data class PresentationPathDto(val id: String, val name: String, val pinIds: List<String>)
data class SavePresentationPathRequest(val name: String, val pinIds: List<String>)
data class PinDateDto(val pinId: String, val startDate: LocalDate, val endDate: LocalDate?)
data class SavePinDateRequest(val startDate: LocalDate? = null, val endDate: LocalDate? = null)
data class BoardExperienceDto(
    val paths: List<PresentationPathDto>,
    val dates: List<PinDateDto>,
    val presentationPathLimit: Int?,
    val connectorLabelLimit: Int?,
)
