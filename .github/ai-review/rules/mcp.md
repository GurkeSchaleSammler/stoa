# Stoasis Node MCP: Architecture, Principles, and Contract

Status: October 3, 2026. This document covers `stoasis-mcp`, the Node/TypeScript service between an MCP client such as ChatGPT and the Stoasis backend.

## Role in the System

The MCP is **not a second backend or second business source of truth**. It is a secure agent adapter:

```text
MCP Client
  -> OAuth 2.1 + PKCE
  -> Stoasis MCP (tool schemas, scope checks, UI resource)
  -> Stoasis Backend (session, business rules, permissions, persistence)
  -> PostgreSQL / Uploads
```

The MCP translates model intent into narrowly typed Stoasis operations. The backend remains authoritative for data, roles, plan limits, invariants, and deletion rules.

## Current Principles

- Remote MCP over stateless Streamable HTTP.
- OAuth 2.1 Authorization Code with PKCE and Dynamic Client Registration.
- Separate read and write scopes.
- Access and refresh tokens are stored only as hashes.
- The backend session is stored encrypted; passwords are not persisted.
- Zod validates configuration and tool inputs at the boundary.
- Tools carry Read/Write/Destructive/Open-World annotations.
- `get_board` returns a spatial snapshot rather than an unconnected pin list.
- `render_board` exposes an MCP UI resource.
- Storage is split behind an interface with Memory and PostgreSQL adapters.
- Each MCP request receives an isolated server/transport; the business session is part of the OAuth grant.

## Binding MCP Contract

### 1. Thin Adapter, Backend as Source of Truth

- Do not independently reimplement business rules in the MCP.
- Client-side prevalidation exists only to improve errors; the backend decides authoritatively.
- The MCP never writes directly to Stoasis business tables.
- Business DTOs should come from a versioned backend contract.

### 2. Tools Are Agent Use Cases

A tool represents one clear intent. It is neither a generic HTTP proxy nor an oversized workflow.

Every tool requires:

- a stable verb-based name,
- a concise purpose and important preconditions,
- a narrow Zod input schema with limits and descriptions,
- structured output,
- correct tool annotations,
- stable error codes or actionable error messages,
- tests for success, validation failure, missing scope, and backend failure.

### 3. Read Before Write for Spatial Changes

- Before changing layout, stacks, connectors, zones, labels, or stickers, the agent reads `get_board`.
- Mutations reference stable IDs from the snapshot, never visible titles alone.
- For potentially stale snapshots, the backend contract should eventually return a version/ETag or conflict.
- Multi-step changes are either one atomic backend use case or re-evaluated after each step.

### 4. Least Privilege and Scope Contract

- `stoasis:read`: observational tools and rendering only.
- `stoasis:write`: create and update tools. Scope implication must be explicit, not assumed from names.
- Destructive tools are annotated as destructive and clearly described as such.
- Enable `openWorldHint` only for real access to external resources, currently link preview for example.
- Plan later fine-grained scopes with backward compatibility.

### 5. OAuth and Secret Contract

- Authorization Code + PKCE remains mandatory; do not shortcut end-user access with a static API key.
- Revalidate redirect URI, resource/audience, client, and scope when issuing and exchanging grants.
- Consume authorization codes and refresh tokens atomically and only once.
- Persisted tokens are hashed; backend sessions use authenticated encryption.
- Document key rotation, token expiry, and revocation effects in a runbook.
- Passwords exist only in memory during the login request and never appear in logs.

### 6. Validation at Every Trust Boundary

- Environment: Zod and fail-fast behavior.
- MCP tool input: Zod with length, range, and enum limits.
- Backend response: do not trust type assertions alone; runtime-validate critical responses or consume a generated, tested contract.
- Database rows: decoders/mappers validate optional and JSON fields.
- URL/redirect/resource: normalize and compare exactly.

### 7. Errors

The MCP distinguishes:

- invalid tool input,
- invalid OAuth scope/token,
- Stoasis unauthorized or Premium revoked,
- object not found or invisible,
- business conflict,
- external/backend timeout,
- internal error.

Never return internal stack traces, database details, cookies/tokens, or private content to the client or logs. Errors should give the agent a safe next step, such as “read the board again” or “reconnect Stoasis.”

### 8. Idempotency and Side Effects

- Read tools are side-effect free.
- Do not assume retries of Create/Delete are safe.
- Prefer backend idempotency keys for create and batch tools.
- After a timeout that may have followed a commit, read state before writing again.
- Tool results clearly identify what was created, changed, or deleted, including stable IDs.

### 9. Observability and Privacy

- Structured logs contain operation, status, duration, trace/request ID, and anonymized error class.
- Do not log all tool arguments; board content can be private.
- Metrics cover tool calls, latency, error classes, OAuth errors, backend timeouts, rate limits, and storage errors.
- The backend records audit-relevant mutations because it authoritatively joins the actor and business object.

### 10. MCP App/UI

- The UI resource visualizes structured output; it is not the only source of information.
- Tool results remain understandable without UI rendering.
- Embedded content receives no unnecessary network or script access.
- Presentation uses the same spatial model and semantic colors as the web frontend without duplicating the entire UI.
- Accessibility applies to the embedded board as well.

## Module and Dependency Direction

```text
index.ts (HTTP composition root)
  -> auth/provider.ts
  -> mcp/server.ts
       -> board.ts
       -> stoasis/client.ts
  -> storage/types.ts
       <- storage/memory.ts
       <- storage/postgres.ts
```

Rules:

- `index.ts` wires and starts the application; it contains no tool or business logic.
- `mcp/server.ts` registers tools and delegates use cases.
- `stoasis/client.ts` encapsulates HTTP, cookies, timeout, and error translation.
- `storage/types.ts` is the port; adapters do not know the OAuth provider.
- `board.ts` and other mappers are pure and testable without Express/MCP.
- OAuth code imports no tool implementation.

## Current MCP Technical Debt

| Priority | Debt                                                                                             | Risk / action                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Backend types are duplicated manually and responses are mainly cast                              | Contract drift may appear only at runtime. Introduce OpenAPI-generated DTOs or runtime decoders.                                   |
| P1       | PostgreSQL schema uses startup-time `CREATE TABLE IF NOT EXISTS`                                 | There is no versioned migration/review/rollback history. Add a migration tool or Flyway-compatible migrations for `stoasis_mcp_*`. |
| P1       | CI quality gates are incomplete                                                                  | `npm ci` and `npm run check` now gate image builds/publication. Audit, PostgreSQL integration tests, and required branch checks remain open. |
| P2       | `src/mcp/server.ts` has 871 lines and registers almost every tool centrally                      | Split tool families by Board, Pin, Stack, Connector, and Decoration; introduce shared auth/result/error wrappers.                  |
| P2       | `auth/provider.ts` (449), API client (370), and PostgreSQL storage (331) are additional hotspots | Separate protocol core, login UI, token service, and mappers/queries without dispersing security logic.                            |
| P2       | Rate limits are per instance                                                                     | Multiple replicas increase the effective limit. Use shared storage or gateway limits.                                              |
| P2       | No real PostgreSQL integration tests are visible                                                 | Test atomic code/refresh-token consumption, cleanup, and concurrent requests against PostgreSQL.                                   |
| P2       | Observability is limited to console JSON with few fields                                         | Add correlation IDs, metrics, safe error classes, dashboards, and alerts.                                                          |
| P2       | Direct mutations have no general idempotency/version contract                                    | Network timeouts can cause duplicates or lost updates. Add backend idempotency keys and version conflicts.                         |
| P3       | Login HTML/CSS is embedded as a string in the OAuth provider                                     | This complicates CSP, tests, localization, and maintenance. Isolate a template/renderer and test security headers/CSP explicitly.  |
| P3       | Version `1.0.0` is repeated statically                                                           | Derive build info and health version from package metadata to avoid drift.                                                         |

## Test Strategy

### Unit

- Configuration parsing and production fail-closed behavior
- Hashing/encryption and manipulated ciphertext
- Board snapshots, bounds, and relationships
- Scope, resource, and error mapping
- Tool schemas and result mappers

### Contract

- Every tool can be listed and has correct annotations.
- Tool inputs and structured outputs match stored schemas.
- Backend responses match the agreed OpenAPI version.
- The MCP UI renders representative snapshots.

### Integration

- Full OAuth Authorization Code + PKCE flow
- Invalid redirect, audience, scope escalation, replay, and revocation
- Concurrent refresh/authorization-code exchange against PostgreSQL
- Premium removal and MCP revocation on the next request
- Backend timeout/401/403/404/409/500
- Rate limits and proxy configuration

## Checklist for a New Tool

1. Is it a clear Stoasis use case rather than a generic proxy?
2. Which scope and annotations apply?
3. Must the agent read `get_board` first?
4. Are input limits, IDs, enums, and descriptions complete?
5. Is the operation idempotent; what happens after a timeout following commit?
6. Which backend permission and invariant decides authoritatively?
7. Is the output structured and understandable without the UI?
8. Are private data excluded from logs and errors?
9. Do unit, contract, and relevant integration tests exist?
10. Are README/tool list, API contract, and changelog updated?

## Definition of Done for MCP Changes

- Tool and backend contract are compatible and versioned.
- OAuth scope and tool annotations are correct.
- Runtime validation exists at the trust boundary.
- Retry/idempotency/conflict behavior is defined.
- No secrets or private content are logged.
- Memory and PostgreSQL paths behave consistently.
- Build, tests, audit, and relevant OAuth/tool contract tests pass.
