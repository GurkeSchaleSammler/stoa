# Frontend Technical Debt

Status: October 3, 2026. This assessment is based on the current source code in `stoasis-frontend`, the Angular configuration, and the existing tests and build pipelines. Priorities describe risk and recommended order, not the quality of the work completed so far.

## Executive Summary

The frontend already has a solid direction: standalone components, `OnPush`, zoneless change detection, signal inputs/outputs, domain-oriented folders, and a visible separation between API, application state, feature handlers, and UI. The main debt is not outdated Angular technology, but missing guardrails around a rapidly grown board feature.

The frontend debt items called out for prioritization are:

1. high complexity in the board; its previously global stylesheet selectors are now scoped to `.stoa-board` (FE-02),
2. manually duplicated backend contracts (FE-03),
3. inconsistent design and asynchronous state conventions (FE-05 and FE-06).

Insufficient critical-flow coverage and missing CI quality gates remain additional high-priority risks (FE-01 and FE-04).

## Inventory

- 276 TypeScript files, but only 22 spec files
- 47 SCSS files and approximately 22,600 lines of TS/HTML/SCSS combined
- modern Angular APIs: signals, `input()`, `output()`, `computed()`, and `effect()`
- `provideZonelessChangeDetection()` and predominantly `ChangeDetectionStrategy.OnPush`
- the board keeps `ViewEncapsulation.None` so its styles can reach child components, with its selectors and animation names now scoped to the unique `.stoa-board` root
- no remaining classic `@Input`/`@Output`/`EventEmitter` usage
- no ESLint script, end-to-end test setup, or accessibility test setup
- CI now runs frontend tests and a production build before image publication; linting, accessibility checks, and audits are still absent

## Prioritized Debt

| ID    | Priority | Debt                                                               | Evidence and risk                                                                                                                                                                                                                                                    | Recommended next step                                                                                                                                                            |
| ----- | -------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-01 | P1       | Critical user journeys are insufficiently protected                | There are 22 specs for 276 TS files. Groups, membership, large parts of board interaction, navigation, and accessibility lack targeted tests. Regressions in drag-and-drop, permissions, or optimistic updates can remain unnoticed.                                 | Introduce a risk-based test matrix: login, board loading, pin CRUD, moving/stacking, roles, import, and MCP connection. Add 5–8 Playwright smoke tests.                          |
| FE-02 | P1       | The board has high complexity; its CSS was globally scoped          | `board-canvas.html` has 377 lines and behavior is spread across an inheritance chain. Board selectors and animation names are now scoped/namespaced under `.stoa-board`; `ViewEncapsulation.None` remains so board styles can reach its child components. | Gradually replace inheritance with composable interaction services/directives and group board events by domain concern.                                                       |
| FE-03 | P1       | Client API contracts are still duplicated manually                 | The backend now exposes a runtime-generated OpenAPI schema, but Angular and MCP transport models remain handwritten and can drift from it.                                                                                                                       | Generate client transport types from OpenAPI and check schema/client drift in CI.                                                                                               |
| FE-04 | P1       | CI does not verify all quality attributes                          | Frontend unit tests and the production build now gate image publication. Format/lint, accessibility smoke tests, dependency audits, and branch-protection requirements are still absent.                                                                           | Add format/lint, typecheck, accessibility smoke tests, and dependency audits; require the verification job in repository settings.                                              |
| FE-05 | P2       | Asynchronous state conventions are inconsistent                    | Root services hold signals, start subscriptions internally, and report errors partly as state and partly through snackbars. Individual pages also maintain parallel local state. A single `isMutating` flag is insufficient for concurrent mutations.                | Define a store contract: request status per use case/entity, structured error types, cancellation rules, and explicit state ownership.                                           |
| FE-06 | P2       | Design conventions and tokens are applied inconsistently            | The theme system is strong, but many raw hex/RGB values, inconsistent radii, and local button/dialog styles remain. Themes and contrast can drift.                                                                                                                   | Complete the semantic token set and prohibit new raw colors. Create primitives for Button, Dialog, Field, Banner, Badge, and Card.                                               |
| FE-07 | P2       | TypeScript and template strictness are not maximal                 | `strict`, `strictNullChecks`, and `strictTemplates` are not explicitly enabled. Casts and incomplete template contracts can therefore fail late.                                                                                                                     | Enable strictness incrementally, starting with `strictNullChecks` and `strictTemplates`, followed by the remaining strict flags.                                                 |
| FE-08 | P2       | Accessibility is fragile around direct manipulation                | Focus styles and reduced motion support exist. Drag/resize/canvas operations are pointer-heavy, while a binding keyboard path, dialog focus management, and automated accessibility checks are missing. Text as small as roughly `0.64rem` also reduces readability. | Define keyboard alternatives for board actions, trap/restore dialog focus, establish minimum font size and touch targets, and integrate axe into E2E.                            |
| FE-09 | P2       | Cancellation and concurrency semantics are solved only selectively | `PinService` versions grid updates well, but other load/save flows do not consistently use `switchMap`, request IDs, or abort behavior. Late responses may overwrite newer state.                                                                                    | Use `switchMap`/cancellation for reads and document `exhaustMap`/queue/last-write-wins behavior for writes.                                                                      |
| FE-10 | P2       | The package-manager contract is ambiguous                          | `package.json` declares npm, while the frontend also contains `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Two lockfiles can produce different dependency trees.                                                                                                      | Choose one package manager and keep only its lockfile and documented commands.                                                                                                   |
| FE-11 | P3       | Component and event naming is inconsistent                         | Outputs are named both `close` and `onClose`; DOM-level events and domain commands coexist. Selectors use `ui-`/`feature-`, while the Angular project prefix is `app`.                                                                                               | Apply the naming contract from `frontend-principles-and-contracts.md` to new and modified components, and migrate incrementally.                                                 |
| FE-12 | P3       | Large stylesheets obscure ownership                                | `board-console.scss` has 829 lines and the StoaQL documentation page has 759 SCSS lines. Several domain styles are split into numbered files (`_board-01.scss`, etc.) without semantic ownership in their names.                                                     | Split by component/pattern and use semantic filenames; move shared primitives into the design system.                                                                            |

## Angular-Specific Pitfalls

### Zoneless Change Detection

Zoneless is a strong choice, but it requires discipline. UI-relevant values must be updated through signals, Angular events, `AsyncPipe`, or other Angular-aware mechanisms. Direct mutation of ordinary fields in timers, native listeners, or promise callbacks can fail to trigger a visible update.

**Contract:** Visible mutable state is a signal or derived from a signal. Mutable fields are allowed only for short-lived, non-rendered interaction data.

### Effects

Effects can easily create hidden write chains and cycles. In this project, effects set follow-up state from routes or preferences, among other tasks.

**Contract:** Use `computed()` for derivation and `effect()` only for side effects such as DOM access, storage, navigation, or loading. Signal writes inside effects must be justified and cycle-free.

### Root-Provided Stores

`providedIn: 'root'` survives route changes. Board, collection, or error state can leak into the next route if reset and cancellation are omitted.

**Contract:** Only sessions, preferences, language, and true application caches are global. Feature state is provided at the route hierarchy or has explicit `enter/reset/leave` semantics.

### Signals Plus RxJS

Signals are suitable for synchronous UI state; RxJS remains strong at asynchronous boundaries. Internal `.subscribe()` calls are not inherently wrong, but they hide return values, cancellation, and test seams.

**Contract:** HTTP remains Observable-based until the application layer. It is deliberately subscribed there or adapted with `toSignal()`. Every subscription has lifecycle/cancellation handling and defined error behavior.

### Component Inheritance

The board canvas inheritance chain distributes state and pointer behavior across several base classes. This makes isolation, testing, and side-effect discovery harder.

**Contract:** Composition over inheritance. Reusable behavior belongs in services, directives, or pure functions; UI components do not inherit from other UI components.

### `ViewEncapsulation.None`

Global selectors can affect other screens and make deletion risky.

**Contract:** Emulated encapsulation is the default. An exception requires a unique root class such as `.stoa-board …` and must not publish unqualified element selectors.

### Browser-Only Initialization

`localStorage` is read in application configuration. This is acceptable for the current SPA, but blocks SSR/pre-rendering and makes tests harder.

**Contract:** If SSR or hydration is planned, wrap browser APIs behind adapters/injection tokens. Until then, document the SPA assumption explicitly.

## Recommended Sequence

### Within the Next 1–2 Iterations

1. Add a CI check and establish one package-manager contract.
2. Decide on contract tests versus OpenAPI generation.
3. Add E2E smoke coverage for authentication, boards, and permissions.
4. Audit accessibility of board interactions and dialogs.

### Afterward

1. Gradually split board inheritance and global styles.
2. Establish design primitives and complete semantic tokens.
3. Enable strict templates and TypeScript strictness.
4. Standardize request status and concurrency semantics.

## Definition of Done for Debt Reduction

An item is complete only when:

- the new rule is documented in the relevant contract,
- at least one automated check protects the rule,
- the migration for existing code is described or completed,
- the build, tests, and affected critical user journeys pass.
