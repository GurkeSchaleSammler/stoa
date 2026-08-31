# Import And Export Data Portability

## Summary

Import and export give users confidence that their Stoasis data is not trapped. This feature is currently disabled in the UI and should return with validation, safety, and plan-aware limits.

## Current State

- Frontend has Import and Export UI, currently disabled.
- Backend has profile import-related logic for Pocket CSV style data.
- Export flows are not fully productized.

## User Value

- Users can bring existing bookmarks into Stoasis.
- Users can back up their own data.
- Data portability builds trust, especially before users commit deeply.

## Functional Requirements

- Users can export their own data.
- Users can import supported bookmark formats.
- The import flow must show a preview before writing data.
- The import result must show created, skipped, duplicate, and failed rows.
- Exports must not include data the user cannot access.
- Import must never execute remote HTML, scripts, or spreadsheet formulas.

## Backend Requirements

- Provide safe import parsing with row-level validation.
- Provide export endpoints for owned boards and user-owned profile data.
- Enforce permission checks on every exported collection.
- Add duplicate detection for imported URLs.
- Add size limits and content-type validation.
- Keep import side effects transactional per batch or per row with clear reporting.

## Frontend Requirements

- Re-enable buttons only when backend behavior is complete.
- Show import preview before final confirmation.
- Show an import result report.
- Let users choose destination board or Inbox when available.
- Provide JSON and CSV export actions with clear scope labels.

## Free And Premium Boundary

Data portability should exist for all users, but heavy imports and full exports can be premium.

Suggested limits:

- Free: manual export of own boards as JSON once per day.
- Free: CSV import up to 100 rows per import.
- Premium: unlimited manual exports within abuse limits.
- Premium: CSV import up to 10,000 rows.
- Premium: full account archive export.

Free users must still be able to leave with their core data. Plan limits should control volume and frequency, not ownership of data.

## Acceptance Criteria

- Export only includes data the current user is allowed to access.
- Import preview runs without writing data.
- Import result reports row-level outcomes.
- Free volume limits are enforced by the backend.
- Disabled UI is replaced by real working actions or clearly labeled limited actions.
