# MCP Connection

## Summary

The MCP connection lets ChatGPT interact with Stoasis boards through a remote MCP server. This is a strong premium feature because it connects Stoasis to an external AI workflow without limiting normal in-app usage.

## Current State

- The repository includes a separate `stoasis-mcp` service.
- MCP exposes tools for board reading, search, link preview, pin creation, board updates, and spatial board elements.
- OAuth 2.1 and PKCE are implemented in the MCP service.
- Production requires HTTPS and persistent OAuth storage.

## User Value

- Users can ask ChatGPT to inspect, search, and update boards.
- Stoasis becomes useful inside AI workflows.
- Users can turn unstructured notes into board content faster.

## Functional Requirements

- Premium users can connect Stoasis to ChatGPT through MCP.
- MCP must authenticate through OAuth.
- MCP must respect the user's Stoasis permissions.
- MCP write tools must require write scope.
- Users must be able to revoke access.
- Free users should see the feature as available to upgrade, not as a broken connection.

## Backend Requirements

- Expose user plan information to MCP authorization.
- Reject MCP connection or token issuance for free users.
- Keep normal Stoasis API access available for free users.
- Support access revocation.
- Use persistent OAuth storage in production.
- Keep request logging safe and avoid storing user passwords.

## Frontend Requirements

- Add an MCP connection section in profile or settings.
- Show connection status.
- Show "Premium required" for free users.
- Provide setup instructions only when the user has access.
- Provide revoke/disconnect actions for connected users.

## Free And Premium Boundary

MCP is premium-only.

Free users:

- can use the full Stoasis web app within normal free limits
- can see that MCP exists
- cannot create an MCP OAuth connection
- should get a clear upgrade explanation

Premium users:

- can connect MCP
- can use read and write tools according to granted scopes
- can revoke tokens

This limit must not block board creation, pin creation, search, login, or normal browser usage.

## Acceptance Criteria

- Free users cannot complete MCP OAuth authorization.
- Premium users can complete MCP OAuth authorization.
- MCP tools respect board permissions.
- Revoking access invalidates future MCP requests.
- The web app remains fully usable when MCP is unavailable.
