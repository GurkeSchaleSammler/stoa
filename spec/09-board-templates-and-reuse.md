# Board templates, duplication and optional onboarding

## Product behaviour

The create-board screen offers Blank, Project, Week, Research, Moodboard and Learning.
The five templates are a small curated catalog, not a separate layout editor. They create
normal notes, labelled colour zones, numbered annotations and one SVG sticker using
the existing Stoasis board presets. All elements remain independently editable.
Template text is created in the user's selected DE/EN/FR/IT language.

Board duplication is available to members of ordinary boards. The user chooses a name.
The new board is private and has only the copying user as owner. It gets new board,
pin and decoration IDs. Content, tags, colours, positions, heights, layers, stacks,
stack-child order/original positions, connectors, zones, labels and stickers survive.
Memberships, invite tokens, discussions and original authorship do not. Profile/skill
boards and World-bound portal pins are deliberately excluded. At most 1000 pins are duplicated in one transaction.
Capacity failures roll back the entire copy; existing source data remains intact.

Pin details offer Copy and, for editors, Duplicate. Paste is available on editable boards.
The in-app clipboard persists while navigating between boards but is cleared when the
account changes and on page reload. It stores only a source board/pin reference and a
short display label. Paste copies current persisted content, rechecks source membership
and destination edit permission, respects allowed pin types and photo capacity, and
finds a valid free position. Uploaded image bytes may be referenced by multiple pins;
the existing upload lifecycle retains them while references exist. Comments are excluded.
Ctrl/Cmd+C and Ctrl/Cmd+V have the same meaning when a pin is selected; native text
selection, inputs, editable content and native dialogs keep their normal shortcuts.

## Reusable onboarding

`DialogComponent` uses native modal focus trapping, Escape and focus restoration.
`PopoverComponent` adds anchored positioning that is clamped to the viewport and updated
on scrolling/resizing. `OnboardingComponent` runs a feature-provided definition containing
a versioned key, introduction and short anchored steps. The initial dialog offers Skip.
Closing/Escape also acknowledges Skip. Completion and Skip are saved only after the API
confirms success; failures keep the tutorial available. An explicit replay action remains.
Missing anchors fall back to a centred dialog (e.g. viewer-only actions).

The templates tutorial and board-copy tutorial have independent versioned keys so future
features can add optional tours without changing the reusable UI or database schema.

## HTTP contract

All routes require a session and use the existing Origin/CSRF protection.

| Method/path                                  | Request                                                                | Result                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| GET `/api/collections/templates?language=de` | `de`, `en`, `fr`, `it`                                                 | 200: catalog IDs, motifs and localized section titles/colours |
| POST `/api/collections/from-template`        | `templateId`, `name` (1–180 chars), optional `emoji` (≤32), `language` | 201: standard `CollectionDetail`                              |
| POST `/api/collections/{id}/duplicate`       | `name` (1–180 chars)                                                   | 201: standard private `CollectionDetail`                      |
| POST `/api/collections/{id}/pins/copy`       | `sourceCollectionId`, `pinId` (≤64 chars)                              | 201: standard independent `PinDto`                            |
| GET `/api/me/flags`                          | no user ID accepted                                                    | 200: `{key, outcome, seenAt}[]` for the current user          |
| PUT `/api/me/flags/{key}`                    | `outcome`: `completed` or `skipped`                                    | 204: first acknowledgement saved idempotently                 |

Tutorial keys match `tutorial.[a-z0-9.-]{1,80}`. The server resolves the user exclusively
from the session. Invisible source boards/pins produce 404; missing target write
permission produces 403. Invalid catalog IDs/input produce 400, incompatible target pin
types, unavailable capacity and non-empty bulk-copy destinations produce 409. Exceptions
use the existing common error contract. Springdoc derives OpenAPI from these controllers
and validated DTOs at `/v3/api-docs`.

## Persistence and rollout

Flyway V16 adds `user_flags(user_id, flag_key, outcome, seen_at)`. The compound primary
key prevents duplicate flags; the outcome check protects valid states. The user FK uses
`ON DELETE CASCADE`. UTC timestamps are obtained from an injected Clock. PostgreSQL
`ON CONFLICT DO NOTHING` gives first-acknowledgement-wins semantics across concurrent tabs.
H2 PostgreSQL mode runs the same statement in local API tests.

Run the existing `scripts/db/migrate_and_verify.sh` workflow before deploying the new
backend. V16 is additive, requires no backfill and leaves earlier user/content tables
unchanged. Rolling back the app can leave the new table in place. Monitor flag-save and
board-copy API failures; a forward fix is preferred to dropping stored tutorial choices.
PostgreSQL upgrade tests cover V15→V16, uniqueness and user-deletion cascade. Local API
tests cover all five templates, graph remapping, role checks, invalid input and Skip.
