# Live cursors on shared boards

Authenticated board members see each other's cursor and display name on the spatial board. Viewers participate too. An unobtrusive presence strip lists other people currently on the board. Public visitors and people without membership cannot read or publish presence.

## Behavior

- Cursor positions use board pixels, independent of scroll and zoom. Labels keep their screen size when zooming; cursor movement respects reduced-motion preferences.
- Leaving the board, changing to list view, or hiding the tab ends presence. Leaving the canvas hides the pointer while preserving the participant's presence.
- Each mounted board screen has its own random client ID. Multiple windows are deduplicated by user, preferring the latest visible cursor; one window leaving cannot remove another.
- Lost connections clear the local cursor overlay and retry with a bounded backoff. Abruptly disconnected peers expire after eight seconds.
- Names come from the authenticated membership, not the request. Responses expose only user ID, display name, and cursor position; no email addresses or session identifiers.

## Transport and storage

`POST /api/collections/{id}/presence/{clientUuid}` exchanges the current nullable cursor with a snapshot of other active members. `DELETE` on the same URL leaves that client. Both use existing session and origin protections. Membership is checked on every exchange, including read-only roles.

The client sends only one request at a time, every 250 ms while others are present and every second while alone, with a five-second request timeout. No full board/pin data is reloaded. This is short polling, not WebSocket delivery; request latency adds to the interval.

Migration V18 stores temporary leases in the shared database so replicas do not require sticky sessions or a separate broker. Foreign keys remove leases when membership is deleted. There are at most eight leases per member, and a scheduled job removes expired rows every ten seconds. Cursor updates never touch the board's content or modification date.

This intentionally uses the existing infrastructure. Database traffic grows with concurrent board viewers (up to four exchanges per second per viewer); high-concurrency deployments should move this transport to a shared pub/sub channel after measuring load.

## Verification

API tests cover member/viewer access, anonymous and public non-member rejection, revoked membership, board isolation, identity privacy, coordinate bounds, expiry, tab limits and independent tab cleanup. Frontend tests cover zoom/scroll coordinate conversion, throttling, navigation cancellation, network retry and revoked access.
