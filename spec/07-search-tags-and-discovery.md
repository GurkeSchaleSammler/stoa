# Search Tags And Discovery

## Summary

Search and tags help users find saved content after boards grow. The free version should include solid basic search, while premium can add power-user discovery features.

## Current State

- Frontend has a search route and search UI.
- Backend has a search domain.
- Pins support tags.
- Tag UI exists in pin creation and search.

## User Value

- Users can find old pins quickly.
- Tags become useful across multiple boards.
- Search makes Stoasis feel like a knowledge base, not only a visual canvas.

## Functional Requirements

- Users can search their accessible pins.
- Users can filter by tag and pin type.
- Search results must include the collection name.
- Private board permissions must be respected.
- Tags should normalize consistently.
- Search should stay fast for common account sizes.

## Backend Requirements

- Enforce collection visibility and membership on search.
- Search title, description, note content, URL, caption, site name, and tags.
- Add pagination before large production usage.
- Add indexes for fields used heavily by search.
- Return enough metadata for result previews.

## Frontend Requirements

- Keep search field focus styling stable.
- Show type and tag filters.
- Link every result back to the owning board or pin detail.
- Show empty, loading, and error states.
- Keep tag remove icons aligned and accessible.

## Free And Premium Boundary

Basic search should remain free. Premium should add depth, not hide existing content.

Suggested limits:

- Free: basic search across accessible boards.
- Free: filter by one tag and one type at a time.
- Premium: saved searches.
- Premium: multi-tag boolean filters.
- Premium: tag analytics and suggested cleanup.
- Premium: future semantic search if introduced.

Free users must always be able to find their own pins with basic text search.

## Acceptance Criteria

- Search respects access permissions.
- Basic search works for all users.
- Premium-only filters are visually present but clearly limited.
- Reaching premium-only capability limits does not hide existing pins.
- Search results are useful on mobile and desktop.
