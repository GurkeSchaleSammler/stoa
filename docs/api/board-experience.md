# Board views and presentation paths

The authenticated board provides five views: canvas, list, network, timeline and
presentation paths. `?view=network|timeline|presentation|board|list` selects the view.
Network layout is deterministic and does not alter canvas coordinates. It includes
stacked and isolated pins and highlights the selected pin's direct neighbours.

## Entitlements

Board capacity uses the **board owner's** plan, including collaborative edits:

| Capability                           | Free      | Premium   |
| ------------------------------------ | --------- | --------- |
| Network and timeline                 | Unlimited | Unlimited |
| Non-empty connector labels per board | 10        | Unlimited |
| Saved presentation paths per board   | 7         | Unlimited |
| Stations within a path               | Unlimited | Unlimited |

Empty/whitespace-only labels do not consume capacity. Repeated visits to a pin
are permitted. Editing existing labels/paths, deleting and reading remain possible
after a downgrade. Duplicating a board preserves labels, dates and paths, remaps
pin IDs, and atomically rejects copies that exceed the destination owner's limits.
Anonymous public-board pages retain their existing read-only pin presentation.

## HTTP contract

OpenAPI is generated from controllers at `/v3/api-docs` and `/v3/api-docs.yaml`.
All routes below use the established session and origin/CSRF protections.

- `GET /api/collections/{collectionId}/experience`: authorized viewers receive
  `{ paths, dates, presentationPathLimit, connectorLabelLimit }`. A null limit
  means unlimited. Paths: `{ id, name, pinIds: string[] }`. Dates:
  `{ pinId, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" | null }`.
- `POST .../experience/paths`: editors create `{ name, pinIds }`; returns 201 and
  the saved path. Names are trimmed, required, max 120 characters. At least one
  pin is required and all pins must belong to the board.
- `PUT .../experience/paths/{pathId}`: editors replace name and ordered stations;
  returns 200 and the saved path. Path IDs are scoped to the requested board.
- `DELETE .../experience/paths/{pathId}`: editors delete a path; 204.
- `PUT .../experience/dates/{pinId}`: editors save `{ startDate, endDate }`; 204.
  Null/omitted start and end remove the date. End requires start and must not be
  earlier. Dates support years 0001–9999 and carry no timezone.
- Existing connector creation accepts optional `label` (default empty).
  Connector PATCH accepts optional `label` and/or `colorVariant`. Omitted/null
  fields preserve their current values; empty label removes the caption.
  Connector responses now include `label`. Trimmed labels max 120 characters.

Errors use the existing `{ code, message, ... }` contract. 401 requires login,
403 denies access, 404 indicates a missing or foreign-board pin/path, and 400
indicates invalid input. Capacity failures return 409 with
`board.connector_label_limit` or `board.presentation_path_limit`. Invalid date
ranges return 400 with `board.invalid_date_range`.

## Persistence and rollout

Migration V20 adds an empty-default connector label plus relational path, step
and date tables. Board and pin foreign keys cascade deletes. Removing a pin
removes its dates and all visits in saved paths; remaining stations preserve order.
JSON board/account exports include `experience` with paths and dates; connector
labels travel with the existing `elements` snapshot. An emptied path remains readable/deletable/editable but cannot play until it has
stations again. No data backfill is required. In production, run `stoasis-backend/scripts/db/migrate_and_verify.sh`
before deploying the backend (production disables automatic Flyway). Deploy backend before frontend.
Existing clients remain compatible with optional request/extra response fields.
Application rollback leaves additive V20 schema in place; do not reverse or edit
an applied migration. Monitor 409 capacity errors separately from 5xx failures.

The timeline editor stores explicit dates, lists undated pins separately and
retains all content on every plan. The presentation player pans between stations,
has previous/next and arrow-key navigation, Escape, native modal focus trapping,
focus restoration and reduced-motion support.

## Verification

Feature tests cover caps, premium excess, downgrade, label update/removal, date
validation, foreign-board access, viewers, pin deletion and board copying.
PostgreSQL concurrency tests race 12 requests at both capacity boundaries.
Migration tests exercise previous-release upgrades. Frontend tests cover network
cycles/disconnected nodes, timeline order, request cancellation, save errors,
path reordering and playback navigation.
