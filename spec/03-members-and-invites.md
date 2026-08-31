# Members And Invites

## Summary

Members and invites let users collaborate on boards. The feature should support simple role-based collaboration without making solo usage feel limited.

## Current State

- Backend supports listing members, updating roles, removing members, creating invite links, previewing invites, and joining by token.
- Roles include owner, editor, and viewer.
- Frontend has member-management surfaces.
- Public/link visibility is currently disabled in settings.

## User Value

- Users can work together on a board.
- Owners can decide who can view or edit.
- Invite links make collaboration fast.

## Functional Requirements

- Owners can invite people to boards.
- Owners can remove members.
- Owners can change member roles.
- A board must always keep at least one owner.
- Editors can edit pins but cannot manage ownership.
- Viewers can inspect and comment where allowed.
- Invite preview must show the board name and whether the current user is already a member.

## Backend Requirements

- Enforce role checks in services.
- Prevent removing or demoting the last owner.
- Record board `updatedAt` when membership changes.
- Add optional pending email invites later.
- Add audit events later for role changes and joins.

## Frontend Requirements

- Show avatars, names, emails, and roles.
- Align role selection controls consistently.
- Disable invalid role actions with clear copy.
- Show a clear member-limit state before the user tries to invite.
- Keep owners aware when sharing links create viewer access.

## Free And Premium Boundary

Collaboration should be limited by capacity, not blocked.

Suggested limits:

- Free: user can own up to 2 shared boards.
- Free: up to 3 members per shared board.
- Free: can join unlimited boards created by other users.
- Premium: up to 25 owned shared boards.
- Premium: up to 25 members per shared board.

Private solo boards remain usable for all plans. Existing shared boards should not be deleted or hidden when a user downgrades; only new invites or new shared-board activation should be limited.

## Acceptance Criteria

- Owners can invite and manage members within plan limits.
- Free users can still create and edit private boards after hitting collaboration limits.
- Joining someone else's board does not count against the user's owned shared-board limit.
- The backend rejects role changes that would remove the final owner.
- The frontend explains collaboration limits without blocking navigation.
