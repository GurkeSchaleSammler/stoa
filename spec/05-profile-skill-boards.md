# Profile Skill Boards

## Summary

Profile skill boards let users present work and personal skills as visual boards. They should become a lightweight portfolio feature and a natural sharing use case for Stoasis.

## Current State

- Backend creates system profile boards for users.
- Profile boards support skill pins.
- Work and Personal boards exist as board kinds.
- Public profile-board endpoints exist.
- Frontend currently disables visibility options except private.

## User Value

- Users can organize skills visually.
- Users can build a shareable professional profile.
- Recruiters, classmates, or collaborators can view a curated skill map.

## Functional Requirements

- Every user gets Work and Personal skill boards.
- Users can create, edit, delete, and move skill pins.
- Skill pins include name, level, and optional years of experience.
- Profile boards can be private, link-shared, or public when enabled.
- Public profile boards must be read-only.

## Backend Requirements

- Ensure profile boards exist for every new user.
- Keep profile boards non-deletable system collections.
- Enforce skill-only pin types for profile boards.
- Support public read access only through explicit visibility rules.
- Add tests for profile-board creation, visibility, and skill CRUD.

## Frontend Requirements

- Make profile-board editing feel separate from normal collection settings.
- Show clear Work and Personal board switching.
- Support moving skill pins visually.
- Add share controls when visibility is implemented.
- Add a polished public profile-board page.

## Free And Premium Boundary

Private skill boards should remain free. Sharing and presentation depth can be premium.

Suggested limits:

- Free: private Work and Personal skill boards.
- Free: up to 12 skills across profile boards.
- Free: no public profile URL, or 1 basic public profile if growth needs it.
- Premium: unlimited skills within reasonable abuse limits.
- Premium: public and link-shared profile boards.
- Premium: custom profile accent and richer presentation options.

Free users must still be able to maintain a private skill profile. Reaching a skill limit should prevent adding new skills, not hide existing ones.

## Acceptance Criteria

- New users automatically receive profile boards.
- Free users can use private profile boards.
- Plan limits are enforced on skill creation and public sharing.
- Public viewers cannot edit profile boards.
- Existing skills remain visible after downgrade.
