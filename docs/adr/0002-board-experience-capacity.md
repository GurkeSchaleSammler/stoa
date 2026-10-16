# ADR 0002: Board experience capacity and relational presentation paths

Status: Accepted, 2026-10-13.

Network/timeline views are free without feature-specific quotas. Connector
captions and saved presentation paths have per-board capacities funded by the
owner's plan (Free: 10 captions / 7 paths, Premium: no capacity cap).

Mutations authorize the actor and acquire the existing pessimistic collection
row lock before checking capacity and writing. This serializes concurrent board
edits and prevents collaborators from exceeding the quota. An existing object can
still be edited or removed above the limit after downgrade. Board duplication
checks destination capacity in the same transaction and preserves metadata.

Board-owned path/date tables use JdbcTemplate for ordered relational projections
and writes within the same Spring JPA transaction/data source. Copy operations
flush copied JPA pins before JDBC inserts that reference them. Foreign keys remove
orphaned stations/dates when a pin or board is deleted. Paths retain explicit
step order; deletions may leave gaps, which do not affect read ordering. The
presentation UI filters missing pins defensively.

The existing connector JPA entity gains a backward-compatible empty-default label.
Timeline dates live in the board domain to avoid duplicating pin-type DTOs or
changing the existing pin update contract. All new HTTP operations reuse session
authentication, viewer/editor checks and origin protection.
