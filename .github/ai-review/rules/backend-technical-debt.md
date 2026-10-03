# Backend Technical Debt

Status: October 3, 2026. This assessment is based on `stoasis-backend`, its configuration, migrations, tests, and deployment files. The backend test suite, including the new PostgreSQL migration and origin-filter tests, passed locally.

## Executive Summary

The backend is a pragmatic modular monolith with strong foundations: domain packages, explicit application services, transaction boundaries, Flyway, server-side permission checks, `open-in-view: false`, and especially careful protection around external link previews.

The most important remaining debt concerns production readiness and changeability: process-local rate limits, incomplete PostgreSQL integration coverage, manually maintained client DTOs, unenforced module boundaries, and a few very large services. Backend HTTP sessions now use PostgreSQL, production cookie mutations validate their origin, and image publication is gated on tests. Debt reduction is subordinate to database safety: changes must preserve ACID transaction behavior, data consistency and integrity, and service availability during deployments and recovery.

## Implementation Status From This Pass

- **BE-01 — Implemented:** HTTP sessions are stored in PostgreSQL using Flyway-managed tables. Existing in-memory sessions are invalidated once during the first rollout; subsequent restarts and replicas share sessions.
- **BE-02 — Mitigated:** production rejects state-changing requests with an authenticated session unless `Origin` matches the configured allowlist or Fetch Metadata confirms same-origin. A full threat-model ADR and token-based option remain to be documented.
- **BE-03 — Partially implemented:** CI runs a PostgreSQL Testcontainers upgrade test from schema `14`, verifies an existing user row survives `V15`, and checks the current session tables and foreign keys. Critical application integration paths still run with H2.
- **BE-04 — Partially implemented:** Springdoc exposes the generated HTTP schema at `/v3/api-docs` and `/v3/api-docs.yaml`, covered by an API test; Angular and MCP DTOs are not generated from it yet.
- **BE-05 — Partially implemented:** backend tests now gate image publication. Formatting, static analysis, and dependency scanning are not yet separate gates.
- **BE-10 — Partially implemented:** unexpected API errors use the application logger instead of `printStackTrace`; correlation IDs, business metrics, and audit events remain open.
- **BE-11 — Partially implemented:** general API errors now include stable status/validation codes and all request field errors; domain-specific codes and client-side code translation remain open.
- **BE-12 — Partially implemented:** newly generated IDs use full UUIDs, within the existing `VARCHAR(64)` limits. Direct clock calls and injectable ID/clock abstractions remain open.
- **BE-14 — Partially implemented:** migration procedures and a PostgreSQL-plus-upload backup/restore runbook are documented; key rotation, incident response, and config-drift checks remain open.

## Prioritized Debt

| ID    | Priority | Debt                                                        | Evidence and risk                                                                                                                                                                               | Recommended next step                                                                                                                                              |
| ----- | -------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BE-01 | P1       | HTTP sessions needed shared persistence                     | Resolved with PostgreSQL-backed Spring Session and Flyway-managed tables. First rollout invalidates existing process-local sessions; future restarts/replicas share them.                            | Keep revocation behavior covered as MCP/session integration evolves.                                                                                                 |
| BE-02 | P1       | Cookie authentication needs an explicit CSRF boundary       | Production mutations with an existing session now require an allowlisted `Origin` or same-origin Fetch Metadata. `SameSite=Lax` remains defense in depth; the full threat model is still undocumented. | Document the threat model and verify the configured origins and browser assumptions during deployment review.                                                       |
| BE-03 | P1       | Critical database paths still lack PostgreSQL CI coverage   | CI verifies the V14-to-V15 PostgreSQL upgrade preserves an existing user row and checks session tables and foreign keys. Core app integration tests still use H2, where SQL, locking, and isolation can differ. | Extend PostgreSQL Testcontainers coverage to critical authentication and board mutation paths; retain H2 for fast unit/slice tests.                                  |
| BE-04 | P1       | Client contracts are not yet generated from the HTTP schema | Springdoc now exposes generated OpenAPI JSON/YAML. Angular and MCP still maintain their own transport DTOs, and the API error shapes are not fully unified.                                           | Generate/check client transport types from OpenAPI and standardize error codes before changing public response shapes.                                              |
| BE-05 | P1       | CI quality gates are incomplete                             | Backend tests gate image publication now. Formatting/lint, static analysis, dependency scanning, and explicit required-check branch protection remain unconfigured.                                 | Add the remaining checks and mark the verification job required in repository settings.                                                                              |
| BE-06 | P2       | Rate limits are process-local                               | Magic-link limits use a `ConcurrentHashMap`; upload limits use a local map. Restarts and multiple replicas bypass global enforcement.                                                           | Use a distributed atomic limiter, or gateway limits plus business limits in PostgreSQL/Redis. Document proxy IP trust.                                             |
| BE-07 | P2       | Module boundaries are named but not enforced                | Domains directly import entities, repositories, and services from other domains. This creates cyclic or hard-to-separate coupling.                                                              | Use ArchUnit or Spring Modulith; define allowed dependencies. Cross domains through application ports/IDs/DTOs rather than foreign repositories.                   |
| BE-08 | P2       | Individual services carry too many responsibilities         | `StoaQlQueryService` has 509 lines, `PinService` 379, and `StoaQlErrorI18n` 443. Parsing, validation, planning, execution, and mapping risk merging.                                            | Split by use case or pipeline stage; test pure domain policies separately; keep application services small orchestrators.                                          |
| BE-09 | P2       | Upload storage limits scaling and operations                | Production writes to a local directory; all replicas would have to share the same volume. Database and files need coordinated backups.                                                          | Preserve/expand the storage port, plan an object-storage adapter, and operationalize checksums and lifecycle/orphan cleanup.                                       |
| BE-10 | P2       | Observability is minimal and inconsistent                   | Unexpected API errors use the application logger now, but structured request/trace IDs, business metrics, and audit events are absent.                                                           | Add correlation IDs, Micrometer metrics, and safe audit events for auth, roles, export, delete, and MCP revocation.                                                   |
| BE-11 | P2       | Error messages are part of an implicit contract             | General API errors now include stable status/validation codes and all field validation failures, but service errors still rely on German messages and StoaQL has a separate contract.             | Add domain-specific stable codes and localizable parameters; migrate clients to code-based translation. Retain backend text as fallback.                              |
| BE-12 | P2       | Time and ID creation are difficult to test                  | New IDs now use full UUIDs, but `Instant.now()` remains direct in services/entities, and ID generation is not injectable for deterministic tests.                                                | Inject `Clock` and an ID generator; test expiration rules deterministically.                                                                                         |
| BE-13 | P3       | JPA and domain models are largely identical                 | Business rules primarily live in services; entities are persistence-focused and strings represent some plans/types. This is pragmatic, but rules can become dispersed.                          | Do not perform a blanket rewrite. Move only complex invariants into value objects/policies and protect persistent strings with enums/converters.                   |
| BE-14 | P3       | Operational documentation is distributed                    | Database migration steps and a coordinated PostgreSQL/upload backup-restore runbook now exist. Key rotation, incident response, and automatic config-drift checks are still missing.             | Add key-rotation and incident runbooks; automatically check configuration drift.                                                                                     |

## Existing Quality That Must Be Protected

Debt reduction must not weaken:

- ACID transaction guarantees and data consistency/integrity; preserve constraints and transaction boundaries for every mutation.
- Availability during schema changes: use compatible expand/backfill/contract migrations where needed, and document deployment and recovery steps before risky changes.
- The ability to restore PostgreSQL together with uploaded files from a coordinated backup.
- server-side role and plan checks,
- atomic single-use magic links,
- SSRF protection and hard limits for link previews,
- `open-in-view: false`,
- Flyway as the sole schema history,
- safe image decoding instead of proxying foreign content,
- transaction boundaries in the application layer,
- separation of local seeds from production migrations.

## Recommended Sequence

### Within the Next 1–2 Iterations

1. Add PostgreSQL Testcontainers coverage for core auth and board mutation flows.
2. Add CI gates for formatting, static analysis, and dependency scanning; require the verification job in branch protection.
3. Generate Angular and MCP transport types from OpenAPI and validate schema changes in CI.
4. Document the production CSRF assumptions in a security ADR.

### Afterward

1. Distributed rate limits and automated module-boundary checks.
2. Split the StoaQL and Pin hotspots.
3. Observability and recovery runbooks.
4. Object storage only when scaling demand justifies it.

## Definition of Done for Debt Reduction

An item is complete when:

- migration and rollback are documented,
- PostgreSQL constraints, transaction behavior, and data consistency/integrity are verified for affected paths,
- relevant security and data invariants are covered by automated tests,
- production configuration and runbooks are updated,
- the frontend and MCP contract remains compatible or is changed through versioning.
