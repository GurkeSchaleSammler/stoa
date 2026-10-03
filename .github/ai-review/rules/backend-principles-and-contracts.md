# Backend Principles and Contracts

Status: October 3, 2026. This document describes the existing architecture and defines the target contract for `stoasis-backend`.

## Architecture in One Sentence

Stoasis is a **domain-oriented, layered modular monolith** in Kotlin/Spring: controllers form the HTTP boundary, application services execute use cases and permission checks, JPA/Flyway persist state, and `shared` contains technical cross-cutting concerns.

It is **DDD-inspired, but not full tactical DDD**. Application services use persistence entities directly; complex rules predominantly live in services and policies. This pragmatic shape suits the current scale as long as module boundaries and invariants remain explicit.

## Current Model

```text
HTTP / Controller / DTO Validation
              |
              v
Application Service / Use Case / Authorization / Transaction
              |
              v
Repository / JPA Entity / External Adapter
              |
              v
PostgreSQL + Flyway / Mail / Files / Remote HTTP
```

Business packages live under `domains/<domain>` and are mostly divided into `api`, `application`, `data`, and optional `model` packages.

## Binding Backend Contract

### 1. Module Boundaries

- Every capability has exactly one owning domain.
- Never call another domain's controllers or repositories directly.
- Cross-domain collaboration uses a small public application port or IDs/DTOs.
- A domain must not mutate another domain's entity. The owning domain performs the mutation.
- `shared` contains only technical or truly universal concepts, never a hidden business domain.
- Enforce allowed dependencies with ArchUnit or Spring Modulith over time.

### 2. API Layer

- Controllers translate HTTP into one use-case call and back. They contain no business orchestration or repository access.
- Request DTOs validate shape, length, and syntax. The application/domain layer validates business eligibility.
- Response DTOs never expose JPA entities.
- Endpoints use consistent HTTP semantics: `201` for creation, `204` for successful responses without a body, `400` for malformed input, `401` for no session, `403` for missing permission/plan, `404` for unavailable/invisible resources, `409` for business conflicts, and `422` only when deliberately introduced.
- Breaking changes require versioning or coordinated migration of every client.

### 3. Unified Error Contract

Target shape:

```json
{
  "code": "board.overlap_exceeded",
  "message": "Cards may overlap by no more than half.",
  "fieldErrors": {
    "grid": "board.overlap_exceeded"
  },
  "traceId": "…",
  "details": {}
}
```

- `code` is stable and machine-readable.
- `message` is a human-readable fallback, not client control flow.
- `fieldErrors` contains all relevant field errors, not only the first.
- `details` contains only safe, contractually documented data.
- Internal exceptions, SQL, tokens, and personal data never leave the server.

### 4. Application Services and Transactions

- One public method call represents one named use case.
- The application layer owns transaction boundaries.
- Read methods use `@Transactional(readOnly = true)`; mutations use a regular transaction.
- Slow external I/O does not run inside long DB transactions unless atomicity deliberately uses an outbox/retry pattern.
- Services orchestrate; complex pure rules belong in policies/value objects and can be tested without Spring.
- `REQUIRES_NEW` is a documented exception, not the default.

### 5. Authorization and Plans

- Authentication is established centrally; authorization is checked server-side for every use case.
- Ownership, membership role, and plan limit are distinct rules and remain distinguishable.
- A client flag such as `canEdit` is never a security boundary.
- Queries must not reveal other users' objects, including through search, counts, or error-message side channels.
- Changes to roles, plans, account deletion, and MCP revocation emit audit events.

### 6. Persistence

- Flyway is the sole source of schema changes; Hibernate remains on `validate`.
- Never edit a published migration; add a new one.
- Constraints protect central invariants in addition to application checks.
- Generate IDs through an injectable generator using full UUID/ULID values.
- Time comes from an injected `Clock`; the database uses UTC-capable types.
- Paginate list queries once their business upper bound is not small and strictly enforced.
- Explicitly test fetch plans to prevent N+1 behavior and oversized entity graphs.

### 7. Side Effects and Integrations

- Mail, upload storage, remote fetch, and MCP-related access sit behind interfaces/ports.
- External requests have timeouts, size limits, redirect rules, and safe error translation.
- Retry only idempotent operations or operations protected by an idempotency key.
- Decode and normalize uploads, store metadata/checksums, and never proxy foreign active content.
- Security-critical production defaults fail closed.

### 8. Sessions and CSRF

- Browser authentication uses an `HttpOnly`, `Secure` cookie in production.
- Login/verification creates a new session ID; logout invalidates the session.
- Mutating cookie requests have documented CSRF protection. `SameSite` is defense in depth, not the only mechanism.
- Multiple replicas share a session store, rate limits, and revocation state.
- Trust proxy headers and client IPs only from known proxies.

### 9. Observability and Privacy

- Logs are structured and contain `traceId`, route/operation, status, and duration.
- Never log passwords, cookies, tokens, magic links, full import content, or private board data.
- Metrics cover request latency, error rate, DB pool, mail/preview failures, upload volume, and rate-limit hits.
- Audit logs distinguish actor, action, target, timestamp, and outcome.
- Health/readiness checks expose only what is necessary and reveal no secrets.

### 10. Tests

- Pure policies/mappers/parsers: unit tests.
- Repositories, locking, constraints, and migrations: PostgreSQL through Testcontainers.
- Controller contract, authentication, and authorization: API integration tests.
- External adapters: fake/WireMock-style tests for timeout, redirect, size limits, and errors.
- Security regression suite: horizontal access, roles, plan limits, CSRF, session revocation, SSRF, and upload formats.
- Test production migrations from empty to current and at least from the previous release.

## DDD Guardrails

- **Ubiquitous Language:** Terms in specs, backend, frontend, and MCP must match.
- **Aggregate Ownership:** Collection owns Membership/Allowed Types; Pin owns comments and tags only to the extent required by the chosen transaction boundary. Board decorations own their clearly defined invariants.
- **Domain Services/Policies:** Geometry, collaboration, plan limits, and URL policy are good candidates for pure rules.
- **Application Services:** Orchestrate authentication, repositories, policies, and adapters.
- **Repositories:** Handle persistence, not hidden authorization or UI logic.
- **Pragmatic rule:** Do not introduce aggregate/value-object abstractions without a concrete invariant or testing benefit.

## Documentation Improvements

The current backend README is useful but combines setup, architecture, security, feature limits, and operations. The following structure improves discoverability and drift control.

### Keep the README Lean

The README should contain:

1. purpose and system context,
2. a five-minute quick start,
3. the most important commands,
4. links to detailed documentation,
5. support/ownership information.

### Supporting Documents

| Document                          | Content                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `docs/api/openapi.yaml`           | Endpoints, DTOs, authentication, error codes, examples                        |
| `docs/architecture/backend.md`    | Module map, allowed dependencies, request flow                                |
| `docs/adr/*.md`                   | Session store, CSRF, upload storage, StoaQL, and MCP trust-boundary decisions |
| `docs/runbooks/deploy.md`         | Deployment, readiness, rolling updates, migrations                            |
| `docs/runbooks/backup-restore.md` | PostgreSQL plus uploads, restore tests, RPO/RTO                               |
| `docs/runbooks/key-rotation.md`   | Secrets, mail/API keys, session/MCP impact                                    |
| `docs/runbooks/incidents.md`      | Authentication, mail, storage, DB, and preview outages                        |
| `docs/security/threat-model.md`   | Assets, trust boundaries, CSRF, SSRF, uploads, OAuth/MCP                      |
| `docs/data-model.md`              | Entities, ownership, deletion and retention rules                             |
| `docs/configuration.md`           | Every variable, type, default, environment requirement, and secret status     |

### Concrete Gaps in Current Documentation

- Session loss after restart and the path to multiple replicas as a dedicated runbook rather than a side note.
- Explicit CSRF rationale and Origin/cookie assumptions.
- Backup and consistent restoration of PostgreSQL **and** the upload volume.
- Rollback strategy for Flyway migrations.
- Complete error contract and stable error codes.
- Transaction/idempotency semantics for important mutations.
- Data deletion covering accounts, images, exports, magic links, and OAuth/MCP sessions.
- Rate-limit semantics behind reverse proxies and across multiple replicas.
- Observability: dashboards, alerts, log fields, and PII rules.
- Compatibility matrix for backend, frontend, MCP, and StoaQL versions.

### Documentation Contract

- Document every new environment variable in the same change.
- Every public route updates OpenAPI and at least one contract test.
- Every security- or data-relevant architecture decision receives an ADR.
- Every operationally risky migration describes rollout, backfill, monitoring, and rollback/forward-fix.
- Examples contain no real secrets or production personal data.

## Definition of Done for Backend Features

- The use case and owning domain are unambiguous.
- Authentication, authorization, plan limits, and data ownership are verified.
- Transaction and concurrency behavior are defined.
- Request, response, and error code are in the API contract.
- PostgreSQL-relevant logic runs against PostgreSQL.
- Logs and metrics contain no sensitive data.
- Migration, operations, and relevant runbooks are updated.
- All quality gates pass.
