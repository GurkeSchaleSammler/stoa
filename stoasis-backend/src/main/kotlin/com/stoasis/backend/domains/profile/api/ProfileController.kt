package com.stoasis.backend.domains.profile.api

import com.stoasis.backend.domains.profile.application.ProfileService
import com.stoasis.backend.shared.security.CurrentUser
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/profile")
class ProfileController(private val profiles: ProfileService, private val currentUser: CurrentUser) {
    @PatchMapping
    fun update(@Valid @RequestBody request: UpdateProfileRequest) = profiles.update(currentUser.id(), request)

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(request: HttpServletRequest) {
        profiles.scheduleDeletion(currentUser.id())
        request.getSession(false)?.invalidate()
    }

    @GetMapping("/export")
    fun export(@RequestParam(defaultValue = "json") format: String): ResponseEntity<ByteArray> {
        val csv = format.equals("csv", ignoreCase = true)
        val body = if (csv) profiles.exportCsv(currentUser.id()) else profiles.exportJson(currentUser.id())
        val mediaType = if (csv) MediaType("text", "csv") else MediaType.APPLICATION_JSON
        return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("stoasis-export.${if (csv) "csv" else "json"}").build().toString())
            .body(body)
    }

    @PostMapping("/import/pocket", consumes = ["text/csv", "application/octet-stream"])
    fun importPocket(@RequestBody csv: ByteArray) = profiles.importPocket(currentUser.id(), csv)
}
