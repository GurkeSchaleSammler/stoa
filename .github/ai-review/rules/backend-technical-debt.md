# Backend Technical Debt

Status: October 3, 2026. This assessment is based on `stoasis-backend`, its configuration, migrations, tests, and deployment files. The current backend test suite passes.

## Executive Summary

The backend is a pragmatic modular monolith with strong foundations: domain packages, explicit application services, transaction boundaries, Flyway, server-side permission checks, `open-in-view: false`, and especially careful protection around external link previews.

The most important debt concerns production readiness and changeability: process-local sessions and rate limits, missing PostgreSQL contract tests, duplicated API types, unenforced module boundaries, and a few very large services.

## Prioritized Debt

| ID    | Priority | Debt                                                        | Evidence and risk                                                                                                                                                                               | Recommended next step                                                                                                                                              |
| ----- | -------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BE-01 | P1       | Sessions are tied to one backend process                    | The README currently requires one replica; restarts also invalidate MCP connections. Horizontal scaling and rolling deployments are not robust.                                                 | Introduce Spring Session with PostgreSQL or Redis; cover session and MCP revocation semantics with integration tests.                                              |
| BE-02 | P1       | Cookie authentication runs with CSRF protection disabled    | `csrf.disable()` and credentialed CORS are configured deliberately. `SameSite=Lax` reduces risk but does not replace a documented CSRF decision, particularly with future same-site subdomains. | Record a threat model; preferably introduce CSRF tokens for mutating browser requests or strict Origin/Fetch Metadata checks. Clearly separate MCP/API exceptions. |
| BE-03 | P1       | The production database is not tested in CI                 | Development and tests use H2 in PostgreSQL mode. SQL, locks, types, constraints, and Flyway can behave differently on real PostgreSQL.                                                          | Add Testcontainers PostgreSQL for migration tests and critical integration paths. H2 may remain for fast unit/slice tests.                                         |
| BE-04 | P1       | The HTTP contract has no machine-readable canonical source  | Angular and MCP maintain DTOs manually. Error objects are partly generic and partly StoaQL-specific; field validation retains only the first error.                                             | Publish versioned OpenAPI with examples, error codes, and authentication; validate contract diffs in CI.                                                           |
| BE-05 | P1       | CI builds artifacts but does not gate on tests              | The backend Dockerfile runs `bootJar`, not `test`; the workflow builds only the image.                                                                                                          | Add a backend check containing tests, format/lint, migration tests, and dependency scanning before image publication.                                              |
| BE-06 | P2       | Rate limits are process-local                               | Magic-link limits use a `ConcurrentHashMap`; upload limits use a local map. Restarts and multiple replicas bypass global enforcement.                                                           | Use a distributed atomic limiter, or gateway limits plus business limits in PostgreSQL/Redis. Document proxy IP trust.                                             |
| BE-07 | P2       | Module boundaries are named but not enforced                | Domains directly import entities, repositories, and services from other domains. This creates cyclic or hard-to-separate coupling.                                                              | Use ArchUnit or Spring Modulith; define allowed dependencies. Cross domains through application ports/IDs/DTOs rather than foreign repositories.                   |
| BE-08 | P2       | Individual services carry too many responsibilities         | `StoaQlQueryService` has 509 lines, `PinService` 379, and `StoaQlErrorI18n` 443. Parsing, validation, planning, execution, and mapping risk merging.                                            | Split by use case or pipeline stage; test pure domain policies separately; keep application services small orchestrators.                                          |
| BE-09 | P2       | Upload storage limits scaling and operations                | Production writes to a local directory; all replicas would have to share the same volume. Database and files need coordinated backups.                                                          | Preserve/expand the storage port, plan an object-storage adapter, and operationalize checksums and lifecycle/orphan cleanup.                                       |
| BE-10 | P2       | Observability is minimal and inconsistent                   | Unexpected errors use `printStackTrace`; structured request/trace IDs, business metrics, and audit events are absent.                                                                           | Add consistent structured logging, correlation IDs, Micrometer metrics, and safe audit events for auth, roles, export, delete, and MCP revocation.                 |
| BE-11 | P2       | Error messages are part of an implicit contract             | Many services produce German text directly; clients use a mix of raw text and translation keys. Text changes can couple tests and UI behavior.                                                  | Return stable error codes plus localizable parameters; retain backend messages only as fallback. Use a Problem Details-style schema.                               |
| BE-12 | P2       | Time and IDs are difficult to test and operationally narrow | `Instant.now()` and `UUID.randomUUID().take(8)` are used directly. Short IDs increase long-term collision risk, and time logic requires real clocks.                                            | Inject `Clock` and an ID generator; use full UUID/ULID; test expiration rules deterministically.                                                                   |
| BE-13 | P3       | JPA and domain models are largely identical                 | Business rules primarily live in services; entities are persistence-focused and strings represent some plans/types. This is pragmatic, but rules can become dispersed.                          | Do not perform a blanket rewrite. Move only complex invariants into value objects/policies and protect persistent strings with enums/converters.                   |
| BE-14 | P3       | Operational documentation is distributed                    | README, `DEPLOYMENT.md`, Compose, and specs overlap; recovery, rotation, and upgrade paths are not documented as runbooks.                                                                      | Adopt the documentation structure from `backend-principles-and-contracts.md` and automatically check configuration drift.                                          |

## Existing Quality That Must Be Protected

Debt reduction must not weaken:

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

1. Document CSRF and session decisions in a security ADR.
2. Add a PostgreSQL test container for migrations and core auth/board flows.
3. Add CI gates for tests and static analysis.
4. Establish an OpenAPI baseline including a unified error contract.

### Afterward

1. Distributed sessions and rate limits.
2. Automated module-boundary checks.
3. Split the StoaQL and Pin hotspots.
4. Observability and recovery runbooks.
5. Object storage only when scaling demand justifies it.

## Definition of Done for Debt Reduction

An item is complete when:

- migration and rollback are documented,
- relevant security and data invariants are covered by automated tests,
- production configuration and runbooks are updated,
- the frontend and MCP contract remains compatible or is changed through versioning.
