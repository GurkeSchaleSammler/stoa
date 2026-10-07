# Stoasis Worlds and portal pins

## Product behaviour

A World turns ordinary Stoasis boards into one navigable collection. Its owner chooses a
name, symbol and start board, adds further editable boards and places portal pins between
them. Opening a portal keeps the World context, shows the current World above the board
and lets the visitor switch boards or return to the visual overview. A board can belong to
more than one World. The overview lists boards, portal paths and incoming-link counts.

Portal creation is available only when both source and target board belong to the selected
World and the current user may edit both. The optional return-path toggle creates the
reciprocal portal atomically. Deleting a World deletes its portal pins, never its boards.
Copying a portal to another board rechecks the same World membership; duplicating an entire
board omits World-bound portals because the new board is not automatically a World member.
Removing a board is blocked while a portal in that World still points from or to it, and
the start board must be changed before it can be removed.

Worlds can be opened through the workspace navigation. Public and token-shared Worlds use
a dedicated read-only presentation that exposes only explicit World member boards. The
owner defines the entry board. Public visitors can follow portal pins inside the World but
cannot edit boards or discover non-member boards.

## Plans

Free accounts receive one public World containing at most five boards. This includes its
public Stoasis URL, the visual overview, portal navigation and backlinks. Existing content
remains available after a limit is reached.

Premium accounts receive effectively unlimited Worlds and boards in the current product
limits, plus private Worlds and unlisted token links. The data model and World boundary are
the foundation for later custom domains, branding, visitor analytics, guided tours,
passwords and expiring links, versions, portable website export and team roles; those later
capabilities are not exposed by this change.

## HTTP contract

Authenticated routes derive the actor from the existing session:

| Method/path                                         | Request                                          | Result                                                    |
| --------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| GET `/api/worlds`                                   | —                                                | Worlds owned by the current user                          |
| GET `/api/worlds/{id}`                              | —                                                | World map including boards, portals, backlinks and limits |
| GET `/api/worlds/for-board/{collectionId}`          | —                                                | Owned Worlds containing a visible board                   |
| POST `/api/worlds`                                  | `name`, `emoji`, `startCollectionId`             | 201: new World                                            |
| PATCH `/api/worlds/{id}`                            | optional name, emoji, start board and visibility | Updated World                                             |
| POST `/api/worlds/{id}/boards`                      | `collectionId`                                   | Adds an editable ordinary board                           |
| DELETE `/api/worlds/{id}/boards/{collectionId}`     | —                                                | Removes an unused non-start board                         |
| DELETE `/api/worlds/{id}`                           | —                                                | 204; boards survive, World portals do not                 |
| GET `/api/public/worlds/{id}`                       | optional `token`                                 | Published World map without its secret                    |
| GET `/api/public/worlds/{id}/boards/{collectionId}` | optional `token`                                 | Read-only board and pins after World authorization        |

Portal pins use the existing pin routes with `type: "portal"`. Their data contains
`worldId`, `targetCollectionId`, `label`, `emoji` and optional `createReturnPortal`.
Responses additionally contain the target name/symbol and an `available` flag. Invalid
membership, self-links and plan-capacity failures use the common error contract.

## Persistence and rollout

Flyway V17 adds `worlds` and `world_boards`, portal references and presentation fields to
`pins`, updates the pin-type check constraint and enables portal pins on existing ordinary
boards. Foreign keys cascade World membership, set missing portal targets to null and keep
board deletion safe. World and board membership pairs are unique. Owner, membership and
portal lookup indexes support the overview and navigation paths.

The migration is additive apart from widening the existing pin-type constraint. H2 in
PostgreSQL mode executes the same migration in API tests. Feature tests cover Free limits,
Premium visibility, reciprocal portals, public/link authorization, backlink counts and
World deletion. Run the PostgreSQL migration workflow before deployment; a forward fix is
preferred after V17 has been applied.
