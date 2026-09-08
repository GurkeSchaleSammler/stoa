package com.stoasis.backend.domains.mcp.application

import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.plan.application.PlanService
import com.stoasis.backend.shared.web.ApiException
import jakarta.servlet.http.HttpSession
import java.time.Instant
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

const val MCP_SESSION_VERSION = "stoasis.mcp-version"

/** Marks MCP sessions and invalidates all grants through an account version. */
@Service
class McpAccessService(
    private val users: UserRepository,
    private val plans: PlanService,
    @Value("\${stoasis.mcp.public-url:}") private val endpoint: String,
) {
    @Transactional(readOnly = true)
    fun status(userId: String): McpConnectionStatus {
        val user = users.getReferenceById(userId)
        return McpConnectionStatus(user.plan == "premium", user.mcpConnectedAt, endpoint.takeIf { user.plan == "premium" && it.isNotBlank() })
    }

    @Transactional
    fun connect(userId: String, session: HttpSession): McpConnectionStatus {
        val user = plans.lock(userId)
        plans.requirePremium(userId)
        if (session.getAttribute(MCP_SESSION_VERSION) != null) authorize(userId, session)
        session.setAttribute(MCP_SESSION_VERSION, user.mcpVersion)
        user.mcpConnectedAt = Instant.now()
        return status(userId)
    }

    @Transactional(readOnly = true)
    fun authorize(userId: String, session: HttpSession): McpConnectionStatus {
        val user = users.getReferenceById(userId)
        plans.requirePremium(userId)
        if (session.getAttribute(MCP_SESSION_VERSION) != user.mcpVersion) {
            throw ApiException(HttpStatus.UNAUTHORIZED, "MCP-Zugriff widerrufen. Bitte erneut verbinden.")
        }
        return status(userId)
    }

    @Transactional
    fun revoke(userId: String) {
        val user = plans.lock(userId)
        user.mcpVersion++
        user.mcpConnectedAt = null
    }
}

/** Shows account eligibility, the last connection and the configured public endpoint. */
data class McpConnectionStatus(val eligible: Boolean, val connectedAt: Instant?, val endpoint: String?)
