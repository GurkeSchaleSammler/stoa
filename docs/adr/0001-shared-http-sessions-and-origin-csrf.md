# ADR 0001: Shared HTTP sessions and origin-based CSRF protection

- Status: Accepted
- Date: 2026-10-03

## Context

Stoasis authenticates browser and MCP backend requests with the `stoasis_session` cookie. Process-local sessions prevented safe backend restarts and horizontal scaling. Cookie authentication also requires an explicit CSRF boundary because browsers attach cookies automatically.

The production browser and API share one public origin. The MCP service is a server-side client: after OAuth authorization it stores the user's backend session in encrypted form and calls the backend over the private service network. It does not behave like a browser and therefore does not send browser `Origin` or Fetch Metadata headers.

## Decision

1. Spring Session stores HTTP sessions in PostgreSQL tables managed by Flyway. Backend replicas use the same session store.
2. The session cookie is `HttpOnly`, `Secure` in production, and `SameSite=Lax`. `SameSite` is defense in depth and is not the primary CSRF check.
3. In production, an authenticated state-changing request from a browser is accepted only when:
   - its `Origin` is in `stoasis.cors.allowed-origins`, or
   - it has no `Origin` and `Sec-Fetch-Site` is `same-origin`.
4. A state-changing request with a session and neither browser provenance header fails closed.
5. The server-side MCP service identifies authenticated backend calls with `X-Stoasis-Client: mcp`. This marker is accepted only when browser provenance headers are absent. An untrusted `Origin` still causes rejection even if the marker is present. The marker is deliberately omitted from the browser CORS allowlist, so cross-origin browser JavaScript cannot use the exception.
6. Authentication and authorization remain mandatory after the provenance check. The MCP marker is not a credential and does not grant access by itself.

## Consequences

- Sessions survive backend restarts and can be shared by replicas.
- The first deployment of the PostgreSQL session migration invalidates old in-memory sessions, so users sign in once again.
- Browser mutations fail with `403 security.origin_rejected` when their origin is untrusted or their provenance is missing.
- MCP releases that use the explicit marker must be deployed before or together with the fail-closed backend filter. Rolling the backend back to the previous version remains compatible with the additional header.
- Revoking or invalidating the stored backend session immediately prevents later browser and MCP API authorization. MCP OAuth grants must still be revoked through their existing lifecycle when access should be removed completely.
- Changes to public origins, cookie attributes, the MCP marker, or session storage require security regression tests and an update to this ADR.

## Alternatives considered

- Relying only on `SameSite=Lax` was rejected because cookie policy is defense in depth and does not document the application trust boundary.
- Allowing every client without browser headers was rejected because it made the server-to-server exception implicit and failed open.
- A separate token-authenticated backend API for MCP remains a possible future improvement when independent MCP session revocation or service credentials are needed.
