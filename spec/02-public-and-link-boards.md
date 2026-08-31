# Public And Link Boards

## Summary

Public and link boards let users share Stoasis boards outside their private workspace. This is one of the most important adoption features because it turns a private board into something users can send to classmates, teams, clients, or friends.

## Current State

- Backend has public collection endpoints.
- Collections already have `private`, `link`, and `public` visibility.
- Link visibility uses an invite token.
- Frontend visibility controls are currently disabled except for private.

## User Value

- Users can share a board without creating accounts for every viewer.
- Public boards can be used as portfolios, resources, travel plans, or project pages.
- Link boards allow private sharing without full public indexing.

## Functional Requirements

- Owners can switch a board between private, link, and public.
- Private boards are only visible to members.
- Link boards are visible to anyone with the tokenized link.
- Public boards are visible without a token.
- Public and link boards are read-only for non-members.
- Members keep their role-based permissions when viewing shared boards.
- Share URLs must be easy to copy from board settings.

## Backend Requirements

- Keep `/api/public/collections/{id}` and `/api/public/collections/{id}/pins`.
- Enforce visibility in application services, not only in controllers.
- Never expose invite tokens for public boards.
- Generate stable link-share tokens for link boards.
- Allow token rotation later.
- Add tests for anonymous, member, token, and public access.

## Frontend Requirements

- Re-enable visibility selection when backend and UX are complete.
- Add a public board viewer page for normal collections.
- Show read-only state clearly for anonymous viewers.
- Hide edit controls from users without edit permission.
- Provide copy-link and open-public-view actions.
- Show an explicit warning before making a board public.

## Free And Premium Boundary

Free users can share a limited number of boards. Private board usage remains unrestricted by this feature.

Suggested limits:

- Free: 1 active shared board using either link or public visibility.
- Free: shared boards can have up to 3 members.
- Premium: up to 25 active shared boards.
- Premium: up to 25 members per board.

If a free user reaches the limit, existing boards remain accessible. The app should only prevent enabling additional public/link boards or adding additional members.

## Acceptance Criteria

- A private board cannot be viewed anonymously.
- A link board can be viewed with a valid token.
- A public board can be viewed without login.
- Anonymous users cannot edit shared boards.
- Free users can continue using private boards after reaching share limits.
- The frontend displays why a sharing action is limited.
