package com.stoasis.backend.domains.board.api

import com.stoasis.backend.domains.board.application.BoardCopyService
import com.stoasis.backend.domains.board.application.BoardTemplateService
import com.stoasis.backend.domains.board.application.BoardTemplateCatalog
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

data class DuplicateBoardRequest(@field:NotBlank @field:Size(max = 180) val name: String)
data class BoardTemplateSectionResponse(val title: String, val color: String)
data class BoardTemplateResponse(
    val id: String,
    val motif: String,
    val sections: List<BoardTemplateSectionResponse>,
)
data class CreateTemplateBoardRequest(
    @field:NotBlank @field:Size(max = 32) val templateId: String,
    @field:NotBlank @field:Size(max = 180) val name: String,
    @field:Size(max = 32) val emoji: String = "📌",
    @field:Pattern(regexp = "de|en|fr|it") val language: String = "de",
)

@RestController
@RequestMapping("/api/collections")
class BoardBlueprintController(
    private val templates: BoardTemplateService,
    private val copies: BoardCopyService,
    private val user: CurrentUser,
) {
    @GetMapping("/templates")
    fun list(@RequestParam(defaultValue = "de") @Pattern(regexp = "de|en|fr|it") language: String) =
        BoardTemplateCatalog.templates.map { template ->
            BoardTemplateResponse(
                id = template.id,
                motif = template.motif,
                sections = template.sections.map {
                    BoardTemplateSectionResponse(it.title(language), it.color)
                },
            )
        }

    @PostMapping("/from-template")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateTemplateBoardRequest) = templates.create(user.id(), request)

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    fun duplicate(@PathVariable id: String, @Valid @RequestBody request: DuplicateBoardRequest) =
        copies.duplicate(id, user.id(), request.name.trim())
}
