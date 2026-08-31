# Uploads And Photo Pins

## Summary

Uploads and photo pins let users turn Stoasis into a visual collection space. The feature must stay useful for free users while using plan limits to protect storage and infrastructure cost.

## Current State

- Backend stores uploaded binary data and serves uploads through `/api/uploads`.
- Frontend can upload photos when creating photo pins.
- Photo upload preview exists in the add-pin dialog.
- Images are not yet backed by external object storage.

## User Value

- Users can save screenshots, moodboard images, travel photos, and references.
- Visual pins make boards more expressive and easier to scan.
- Upload preview gives confidence before creating a pin.

## Functional Requirements

- Users can upload an image and create a photo pin.
- The app must preview selected/uploaded images before submission.
- Supported formats should include JPEG, PNG, and WebP when backend validation allows it.
- The backend must reject unsupported or unsafe files.
- Pins must store enough image metadata for responsive display.
- Images should be served with safe content headers.

## Backend Requirements

- Validate content type and decoded image dimensions.
- Enforce maximum file size and maximum pixel dimensions.
- Store width, height, mime type, and owner metadata.
- Add image variants or thumbnails before large-scale production use.
- Move production storage to an object store or equivalent durable file service.
- Rate-limit upload endpoints.

## Frontend Requirements

- Show upload progress.
- Show image preview, filename, and validation errors.
- Disable submit while upload is in progress.
- Render photo pins in board view, list view, and detail view.
- Provide accessible alt/caption handling.

## Free And Premium Boundary

Uploads should be limited by storage and file size, not removed from free users.

Suggested limits:

- Free: 50 photo pins total.
- Free: 5 MB maximum per image.
- Free: compressed preview storage only.
- Premium: 2,000 photo pins total.
- Premium: 20 MB maximum per image.
- Premium: higher-quality stored previews and future full-resolution download.

When a free user reaches the limit, existing photo pins remain visible and editable. The app should still allow link and note pins.

## Acceptance Criteria

- A user can upload and preview an image before creating a photo pin.
- Invalid files are rejected server-side.
- Free upload limits are enforced by the backend.
- Reaching the upload limit does not block existing boards, link pins, or note pins.
- Photo pins render correctly in all board surfaces.
