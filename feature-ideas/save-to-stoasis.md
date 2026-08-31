# Save to Stoasis

## Summary

Save to Stoasis lets users capture links, articles, videos, images, and quick notes from outside the app and send them into Stoasis with minimal friction. The feature should make Stoasis feel like a daily capture inbox, not only a board that users open after they already know what they want to organize.

## Problem

Users discover useful content throughout the day in browsers, chats, email, videos, and other tools. If saving that content into Stoasis requires opening the app, finding the right board, creating a pin manually, and adding metadata, many users will postpone it or lose the idea entirely.

## Goal

Give users a fast, reliable way to save content into Stoasis from anywhere, then organize it later or route it directly to a board.

## Target Users

- People who collect research links, videos, inspiration, and references.
- Students and learners who save learning resources across topics.
- Project users who want to collect ideas, sources, and decisions in shared boards.
- Creators who gather visual inspiration and notes before structuring them.

## Core User Value

- Capture content in seconds.
- Automatically preserve title, source, preview image, and URL.
- Avoid losing ideas while switching context.
- Make Stoasis useful before the user starts organizing.
- Create a reason to return to the platform every day.

## Primary User Flow

1. User finds a useful website, article, video, or image.
2. User clicks a "Save to Stoasis" bookmarklet, browser extension, or capture link.
3. Stoasis opens a lightweight capture screen.
4. The backend extracts metadata and detects whether the item already exists.
5. User selects a destination board or keeps the item in Inbox.
6. User optionally adds tags, caption, or a note.
7. Stoasis creates a pin and confirms the save.
8. User can open the created pin or return to the previous context.

## Required Capabilities

### Capture Entry Points

- Provide a capture URL that accepts a source URL.
- Support a browser bookmarklet as the first low-effort entry point.
- Keep the design open for a future browser extension.
- Support direct in-app capture from the board add-pin dialog.

Example:

```text
/capture?url=https://example.com/article
```

### Capture Inbox

- Provide a default Inbox board per user.
- Save captured items to Inbox if no board is selected.
- Let users move captured items from Inbox to another board later.
- Mark Inbox items as unorganized until they are assigned to a board or tagged.

### Metadata Extraction

- Fetch and sanitize page metadata on the backend.
- Extract title, description, canonical URL, site name, preview image, and content type when available.
- Support common Open Graph and Twitter Card metadata.
- Support YouTube previews through oEmbed or an equivalent backend-safe mechanism.
- Fall back to a generated preview if no image is available.

### Duplicate Detection

- Detect existing pins with the same canonical URL for the same user.
- Warn the user before saving duplicates.
- Offer quick actions:
  - Open existing pin.
  - Save duplicate anyway.
  - Add to another board.

### Board Selection

- Show the user's recent boards first.
- Show Inbox as the default target.
- Allow searching boards by name.
- Only show boards where the user can create pins.

### Tags and Notes

- Allow optional tags during capture.
- Suggest tags based on previous user tags and page metadata.
- Allow a short note or caption.
- Preserve the original URL even when a canonical URL is detected.

### Authentication

- Require an authenticated user session for saving.
- If the user is not logged in, redirect to login and resume the capture afterward.
- Preserve the capture URL and entered draft data across login.

### Confirmation

- Confirm that the item was saved.
- Show the destination board.
- Provide actions to open the board, open the created pin, or capture another item.

## Backend Requirements

### Data Model

Create or reuse an Inbox collection for every user.

Potential fields for captured items:

```text
pin.id
pin.collection_id
pin.created_by
pin.type
pin.data.url
pin.data.original_url
pin.data.title
pin.data.description
pin.data.image_url
pin.data.site_name
pin.tags
pin.created_at
pin.updated_at
```

Optional future table:

```text
captures
- id
- user_id
- source_url
- canonical_url
- status
- duplicate_pin_id
- created_pin_id
- metadata_json
- created_at
```

### API Endpoints

```text
GET /api/capture/preview?url={url}
POST /api/capture
GET /api/capture/destination-options
```

`GET /api/capture/preview` should return metadata and duplicate information without creating a pin.

`POST /api/capture` should create the pin in the selected board or Inbox.

`GET /api/capture/destination-options` should return valid boards for the current user.

### Security

- Reuse the existing safe public URL policy.
- Block private IP ranges, localhost, unsupported protocols, and oversized responses.
- Enforce request timeouts.
- Sanitize metadata before storing it.
- Never trust remote page content as HTML.
- Require board membership and create permissions before saving.

## Frontend Requirements

### Capture Page

- Provide a small focused page at `/capture`.
- Automatically preview the submitted URL.
- Show loading, success, duplicate, and failure states.
- Let users choose Inbox or another board.
- Let users add tags and a note.
- Keep the page fast and usable on mobile.

### Bookmarklet

- Provide a copyable bookmarklet from the profile/settings area.
- The bookmarklet should open Stoasis capture with the current browser tab URL.
- The bookmarklet should not require an extension store.

Example behavior:

```text
Open https://stoasis.example/capture?url=<current-page-url>
```

### Board Integration

- Captured pins should appear like normal link/photo/note pins.
- Inbox should be accessible from the main navigation.
- Boards should show a lightweight indication when they contain unorganized captures.

## Non-Goals For First Version

- Full browser extension.
- Offline capture.
- Automatic summarization.
- Team-wide capture rules.
- AI-generated tags as a hard dependency.
- Importing complete web page archives.

## Acceptance Criteria

- A logged-in user can open `/capture?url=...` and save the URL as a pin.
- If no board is selected, the pin is saved to the user's Inbox.
- The backend extracts metadata and stores a usable link pin.
- Duplicate URLs are detected for the current user.
- The user can still save a duplicate after confirmation.
- Private/internal URLs are rejected by backend validation.
- The capture flow survives login redirects.
- Captured pins appear correctly in board view, list view, and pin detail.
- The feature works on mobile and desktop.

## Future Enhancements

- Browser extension with one-click save.
- Right-click image capture.
- Quick capture from mobile share sheets.
- Automatic summaries for long articles.
- Smart tag suggestions based on board history.
- Rules that route captures to specific boards.
- Notifications for shared board captures.
- Activity feed entries when a capture is added to a shared board.
