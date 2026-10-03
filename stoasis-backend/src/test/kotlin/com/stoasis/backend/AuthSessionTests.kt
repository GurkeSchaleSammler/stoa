package com.stoasis.backend

import com.stoasis.backend.domains.auth.api.*
import com.stoasis.backend.domains.auth.application.AuthService
import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.mcp.application.MCP_SESSION_VERSION
import com.stoasis.backend.shared.security.CurrentUser
import com.stoasis.backend.shared.security.SESSION_USER_ID
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.mockito.Mockito.*
import org.springframework.http.HttpStatus
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpSession

class AuthSessionTests {
    private val auth = mock(AuthService::class.java)
    private val controller = AuthController(auth, mock(UserRepository::class.java), CurrentUser())
    private val login = LoginRequest("user@example.com", "password123")
    private val register = RegisterRequest("user@example.com", "User", "password123")
    private val token = VerifyTokenRequest("valid-token")

    @ParameterizedTest
    @ValueSource(strings = ["login", "register", "verify"])
    fun `successful authentication replaces the session and discards its previous attributes`(flow: String) {
        val user = UserEntity(id = "user-new", email = login.email, name = "User")
        val result = user to AuthResponse(user.toDto(), Instant.parse("2026-11-01T00:00:00Z"))
        `when`(auth.login(login)).thenReturn(result)
        `when`(auth.register(register)).thenReturn(result)
        `when`(auth.verify(token.token)).thenReturn(result)
        val oldSession = MockHttpSession().apply {
            setAttribute(SESSION_USER_ID, "user-old")
            setAttribute(MCP_SESSION_VERSION, 99)
        }
        val oldId = oldSession.id
        val request = MockHttpServletRequest().apply { setSession(oldSession) }

        when (flow) {
            "login" -> controller.login(login, request)
            "register" -> controller.register(register, request)
            "verify" -> controller.verify(token, request)
        }

        val newSession = request.getSession(false)!!
        assertTrue(oldSession.isInvalid)
        assertNotEquals(oldId, newSession.id)
        assertEquals("user-new", newSession.getAttribute(SESSION_USER_ID))
        assertNull(newSession.getAttribute(MCP_SESSION_VERSION))
    }

    @Test
    fun `failed login does not authenticate or replace the existing session`() {
        `when`(auth.login(login)).thenThrow(ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"))
        val oldSession = MockHttpSession()
        val request = MockHttpServletRequest().apply { setSession(oldSession) }

        assertThrows(ApiException::class.java) { controller.login(login, request) }

        assertSame(oldSession, request.getSession(false))
        assertNull(oldSession.getAttribute(SESSION_USER_ID))
    }
}
