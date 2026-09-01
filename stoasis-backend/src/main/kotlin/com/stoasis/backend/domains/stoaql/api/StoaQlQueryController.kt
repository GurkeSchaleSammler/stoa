package com.stoasis.backend.domains.stoaql.api

import com.stoasis.backend.domains.stoaql.application.StoaQlQueryService
import com.stoasis.backend.domains.stoaql.application.StoaQlHistoryService
import com.stoasis.backend.shared.security.CurrentUser
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/query")
class StoaQlQueryController(
    private val queries: StoaQlQueryService,
    private val queryHistory: StoaQlHistoryService,
    private val currentUser: CurrentUser,
) {
    @PostMapping
    fun execute(@RequestBody request: StoaQlQueryRequest): StoaQlQueryResponse {
        val userId = currentUser.id()
        return try {
            queries.execute(userId, request).also { response ->
                queryHistory.recordSuccess(userId, request, response)
            }
        } catch (error: StoaQlException) {
            queryHistory.recordFailure(userId, request, error)
            throw error
        }
    }

    @GetMapping("/history")
    fun history(
        @RequestParam collectionId: String,
        @RequestParam(defaultValue = "30") limit: Int,
    ): List<StoaQlHistoryItem> = queryHistory.list(currentUser.id(), collectionId, limit)

    @DeleteMapping("/history")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun clearHistory(@RequestParam collectionId: String) = queryHistory.clear(currentUser.id(), collectionId)
}
