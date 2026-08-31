# Auth and Magic Link

## Summary

Authentication gives every user a secure way to enter Stoasis with either email/password or a one-time magic link. This feature must stay available on the free plan because it is the entry point to the product.

## Current State

- Backend supports register, login, logout, session check, magic-link request, and token verification.
- Magic-link tokens are hashed, expire after 15 minutes, and are single-use.
- Spring Mail sends plain text email.
- Frontend supports credential login, registration, magic-link request, and verification.

## User Value

- Users can sign in without remembering a password.
- New users can start quickly.
- Returning users keep a long-lived session through an HttpOnly cookie.

## Functional Requirements

- Users can register with name, email, and password.
- Users can log in with email and password.
- Users can request a magic link by email.
- Magic links must expire after 15 minutes.
- Magic links must be usable exactly once.
- Verification must create a session and redirect the user into the app.
- Logout must invalidate the current server-side session.

## Backend Requirements

- Keep `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/magic-link`, and `/api/auth/verify`.
- Store only hashed magic-link tokens.
- Use atomic token consumption to prevent replay.
- Enforce rate limits per email and IP address.
- Generate links from the configured public frontend URL.
- In production, set secure cookie attributes.
- Add CSRF protection for cookie-authenticated state-changing requests.

## Frontend Requirements

- Preserve the requested return URL during login.
- Preserve return URL after magic-link verification, not only after password login.
- Show clear states for sending, sent, verifying, success, expired, and invalid link.
- Provide a resend action after a safe cooldown.
- Keep login usable on mobile.

## Free And Premium Boundary

Authentication is always free. Premium must never restrict login, registration, logout, session validation, or account recovery.

Premium can improve account controls later, for example:

- session history
- trusted devices
- organization login policies
- advanced security notifications

These additions must not prevent free users from accessing their own account.

## Acceptance Criteria

- A user can register and immediately access the app.
- A user can log in with credentials and return to the originally requested page.
- A user can request a magic link and verify it once.
- Expired or reused magic links return a clear error.
- Production sessions use secure cookie settings.
- Auth endpoints are covered by backend integration tests.
