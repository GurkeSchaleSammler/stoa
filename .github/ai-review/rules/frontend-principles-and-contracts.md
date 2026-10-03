# Frontend Principles and Contracts

Status: October 3, 2026. This document first describes the style visible in the current codebase, then defines the target contract for new and modified frontend work.

## Architecture in One Sentence

The Stoasis frontend is **domain-oriented, signal-first, and component-based**: HTTP and asynchronous workflows live in `data`, feature handlers connect state to the UI, and predominantly presentational UI components communicate through signal inputs and outputs.

This is **not full tactical DDD**. There are no consistently modeled aggregates, DDD-style repositories, or a dedicated framework-free domain layer. A more accurate description is: **vertical slices with DDD-inspired business boundaries and lightweight Clean Architecture layering**.

## Current Layers

```text
Route/Shell
  -> feature/*-handler
       -> data/application (signals, use cases, orchestration)
            -> data/api (HttpClient)
            -> data/models
       -> ui (presentation and user events)
shared
  -> truly cross-domain models, UI primitives, and application services
```

### `domains/<domain>`

A business slice such as `auth`, `board`, `collection`, `membership`, `profile`, or `search`. Domains must not be assembled through another domain's internal UI or data files.

### `data/api`

The technical HTTP adapter. It knows endpoints, query parameters, request/response DTOs, and credentials, but not UI navigation or snackbars.

### `data/application`

Owns feature state, orchestrates API calls, applies client-side rules, and exposes readable signals. It contains no DOM or layout details.

### `feature`

A container/handler for a use case or screen section. It connects the router, application services, and UI, and may own local form/dialog state.

### `ui`

Presentational components. Data flows in through inputs and user intent flows out through outputs. UI components do not call domain HTTP APIs directly.

### `shared`

Only code used by at least two business domains and no longer owned by either. `shared` is not a dumping ground for code with unclear ownership.

## Binding Frontend Contract

### 1. Components

- New components are standalone and use `ChangeDetectionStrategy.OnPush`.
- Visible state is a signal or a `computed()` value.
- Do not introduce new component inheritance; composition is the default.
- Selectors use `ui-` for presentational and `feature-` for orchestrating components. Pages may use `<domain>-page`.
- A component file has one clear responsibility. At roughly 200–250 lines, actively assess whether presentation or behavior should be extracted.
- Inline templates are acceptable for small components. Large or structurally complex templates use a separate HTML file.

### 2. Signal Inputs

- Signal inputs are the default; do not add new `@Input()` declarations.
- Required data uses `input.required<T>()`.
- Optional values have a semantically safe default or an explicit `null` type.
- The receiving component never mutates input values.
- Avoid vague names such as `data` when a domain term exists.

Example:

```ts
readonly collection = input.required<CollectionDetail>();
readonly canEdit = input(false);
readonly error = input<ApiErrorView | null>(null);
```

### 3. Outputs

- Signal outputs are the default; do not add new `EventEmitter` instances.
- Outputs name the event that occurred or the user's intent, not an internal method.
- Use a consistent style without an `on` prefix: `closed`, `saveRequested`, `roleChanged`, `pinSelected`.
- An output carries a domain-specific typed payload. Use a named event type for multiple related fields.
- UI components emit; feature handlers decide navigation, API calls, and global feedback.

Example:

```ts
readonly saveRequested = output<SaveCollectionCommand>();
readonly closed = output<void>();
```

Existing `onClose`/`close` variants may be standardized when touched; do not perform a big-bang rename.

### 4. Signals, Computeds, and Effects

- `signal()` stores minimal source state.
- `computed()` represents every value that can be derived purely; do not store derived values separately.
- `effect()` is exclusively for side effects: loading due to route changes, navigation, browser storage, telemetry, or imperative library adapters.
- Do not hide chains of business state mutations in effects. If a workflow deserves a name, it belongs in a method/use case.
- Use `untracked()` only when the excluded dependency is intentional and documented.

### 5. RxJS and HTTP

- `data/api` returns typed Observables and never subscribes internally.
- The application or feature layer owns subscriptions.
- Every subscription terminates through `takeUntilDestroyed`, `toSignal`, `AsyncPipe`, or a source guaranteed to complete.
- Changing read requests use latest-wins semantics through `switchMap` or explicit cancellation.
- Each mutation use case deliberately chooses parallel, queued, ignore-while-running, or last-write-wins behavior.
- Do not pass `unknown` errors into templates; translate them at the boundary into a structured view-error model.

### 6. State Ownership

- Application-global: session, language, theme/preferences, and explicit caches.
- Route/feature-local: active collection, board interaction, dialog drafts, and loading/mutation status.
- Do not duplicate server state unnecessarily. Optimistic updates store the previous value and define rollback and concurrency behavior.
- A boolean `isSaving` is allowed only when at most one mutation can exist. Otherwise track request status per operation or entity.
- When a business key such as `collectionId` changes, consistently terminate the previous request, selection, error, and temporary interaction data.

### 7. Domain and API Models

- Transport DTOs and UI/domain models have different roles, even if their shapes initially match.
- Map HTTP data at the API/application boundary.
- Roles, plans, pin types, and statuses are union types or enums, not arbitrary strings.
- Validate and format money, dates, URLs, grid coordinates, and colors centrally.
- The backend contract is canonical. Once OpenAPI exists, generate transport types from it while keeping UI models handwritten.

### 8. Permissions

- The backend is always authoritative.
- The frontend uses `canEdit`/`canManage` for UX only, never as a security boundary.
- Hide or disable buttons and actions consistently; explain non-obvious limits.
- Handle `401` with controlled session renewal/login, `403` with permission feedback, and `409` with conflict feedback.

### 9. Forms

- Small local fields may use a signal with `[value]`/`(input)` or `ngModel`.
- Multi-field validated forms use one consistent approach per form; do not mix form models inside one flow.
- Client validation improves UX but does not duplicate security assumptions. Map server errors to fields through stable error codes.
- Keep drafts separate from persisted server state.

### 10. Routing

- The URL is the source of truth for shareable/navigation-bearing state: active collection, selected pin, search query, and relevant filters.
- Purely transient state such as hover or an unfinished drag does not belong in the URL.
- Route effects must be repeatable and cancel obsolete requests.
- Lazy-load at domain/page boundaries.

### 11. Styles and Accessibility

- Use only semantic tokens from `design-system.md` for theme-aware surfaces.
- New interactive elements are real `button`, `a`, `input`, etc.; a `div` does not gain button semantics from a click handler alone.
- Every icon-only control has a translated accessible name.
- Dialogs manage initial focus, focus trap, Escape, and focus restoration.
- Pointer actions have a keyboard or form-based alternative.
- Status feedback uses text/icon in addition to color and appropriate live regions.
- Respect reduced motion.

### 12. Internationalization

- Visible text and ARIA text come from translation resources.
- Translation keys follow `<domain>.<feature>.<meaning>` and describe meaning, not position.
- Prefer stable backend error codes for translation; raw messages are a fallback.
- Avoid dynamically concatenated sentences.

## DDD Guardrails for the Frontend

Stoasis uses DDD pragmatically:

- **Ubiquitous Language:** Collection/Board, Pin, Stack, Connector, Zone, Label, Sticker, Membership, and Role have the same names everywhere.
- **Bounded Contexts:** Domains are business ownership boundaries, not merely screen folders.
- **Invariants:** The server remains authoritative; purely UX-oriented invariants may also exist in the client.
- **Value Objects:** Grid, color, role, visibility, and pin type use central types/functions instead of scattered primitives.
- **No artificial purity:** Create Angular-free domain models only when rules benefit from framework-independent testing and reuse.

## Import Rules

Allowed direction:

```text
shared <- domain models/api <- domain application <- feature/page
                                     ^                    |
                                     +------- ui ---------+
```

- `shared` imports no domain.
- `ui` imports domain models and Shared UI, but no domain API.
- `data/api` imports no feature or UI component.
- Direct domain-to-domain imports go through a deliberate public entry point; otherwise a parent feature handler orchestrates them.
- Cycles are forbidden and should be checked automatically.

## Test Contract

- Pure mappers, policies, reducers, and value objects: fast unit tests.
- Application services/stores: success, error, cancellation, and concurrency behavior.
- UI components: inputs, outputs, keyboard behavior, and accessible names.
- Critical user journeys: browser E2E against a real API or clearly defined test environment.
- A bug fix includes a regression test before or alongside the fix.

## Definition of Done for Frontend Features

- Business ownership and layer are unambiguous.
- API and error contracts are typed.
- Loading, Empty, Error, Forbidden, and Success states are handled.
- Keyboard, focus, mobile layout, and reduced motion are verified.
- Relevant unit/component/E2E tests exist.
- No new raw theme colors or unscoped global styles are introduced.
- The production build and all quality gates pass.
