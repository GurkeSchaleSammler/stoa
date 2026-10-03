# Stoasis Design System

Status: October 3, 2026. This document describes the current visual style and turns it into a binding design contract. Existing theme values come from `stoasis-frontend/src/styles`.

## Style Description

Stoasis is a **calm, tactile editorial workspace**: a blend of digital mood board, note wall, and focused productivity tool.

The style is:

- warm and minimal rather than clinical,
- flat and precise with a few soft shadows,
- paper- and card-like on lightly tinted surfaces,
- editorial through serif type for selected headings,
- functional through neutral sans-serif type for controls and content,
- restrained in color: accents guide, signal colors warn,
- compact without being ornamental,
- playful and spatial on the board, but calm and systematic in navigation and forms.

The following do not fit the style: strong neon colors, decorative full-surface gradients, glassmorphism as a base language, excessive rounding, heavy 3D shadows, or colorful status indicators without semantics.

## Design Principles

1. **Content before chrome:** Boards, pins, and text take visual priority over navigation.
2. **Calm hierarchy:** Contrast, spacing, and typography organize; shadows are secondary.
3. **Tactile feedback:** Hover, focus, and drag interactions respond clearly but subtly.
4. **Semantics before raw color:** Components use tokens rather than embedded theme colors.
5. **Accessibility is part of the style:** Color is never the only status channel; focus is visible; motion is optional.
6. **Theme parity:** Light, dark, and all accent palettes retain meaning and readability.
7. **Spatial freedom with guardrails:** The board may be playful; controls and states remain predictable.

## Color Contract

### Semantic Roles

| Token                | Meaning                  | Use for                                       | Do not use for                |
| -------------------- | ------------------------ | --------------------------------------------- | ----------------------------- |
| `--surface-sunken`   | deepest work surface     | app background, board base                    | cards                         |
| `--surface-sidebar`  | navigation layer         | sidebar, secondary rails                      | modal foregrounds             |
| `--surface-raised`   | elevated surface         | cards, dialogs, inputs, popovers              | page background               |
| `--surface-contrast` | maximum-contrast surface | rare inverse elements                         | large areas                   |
| `--text`             | primary text             | headings, body, icons                         | disabled text                 |
| `--muted`            | secondary text           | metadata, help, placeholders                  | critical information alone    |
| `--border`           | default boundary         | inputs, cards, separators                     | focus indication              |
| `--border-strong`    | strong boundary          | active structure, drag edges                  | decorative bulk lines         |
| `--dot`              | canvas/grid detail       | board grid                                    | text/icons                    |
| `--accent`           | primary interaction      | primary action, selection, focus relationship | errors or success             |
| `--accent-strong`    | accent text              | text/icons on `accent-soft`                   | unchecked text on dark accent |
| `--accent-soft`      | soft accent surface      | selection, information, hover                 | primary button fill           |
| `--on-accent`        | text on accent           | content on `accent`                           | general text                  |

### Default Light Scheme

| Role             | Value     |
| ---------------- | --------- |
| Surface sunken   | `#f5f5f2` |
| Surface sidebar  | `#efefeb` |
| Surface raised   | `#ffffff` |
| Surface contrast | `#151515` |
| Text             | `#171717` |
| Muted            | `#62625e` |
| Border           | `#deded8` |
| Border strong    | `#b7b7af` |
| Dot              | `#d4d4cc` |
| Accent           | `#4f6fc8` |
| Accent strong    | `#304f9f` |
| Accent soft      | `#e8eefb` |
| On accent        | `#ffffff` |

### Default Dark Scheme

| Role             | Value     |
| ---------------- | --------- |
| Surface sunken   | `#0f0f0e` |
| Surface sidebar  | `#161615` |
| Surface raised   | `#20201e` |
| Surface contrast | `#f6f6ef` |
| Text             | `#f4f4ef` |
| Muted            | `#a4a49b` |
| Border           | `#34342f` |
| Border strong    | `#56564d` |
| Dot              | `#30302a` |
| Accent           | `#7f9bea` |
| Accent strong    | `#a9bdf5` |
| Accent soft      | `#25304a` |
| On accent        | `#10131d` |

### Signal and Status Colors

Status colors do **not** change with the selected accent palette. Their meaning must remain stable.

| Status       | Light foreground            | Light soft                 | Dark foreground | Dark soft | Use                             |
| ------------ | --------------------------- | -------------------------- | --------------- | --------- | ------------------------------- |
| Info/neutral | `--accent-strong` `#304f9f` | `--accent-soft` `#e8eefb`  | `#a9bdf5`       | `#25304a` | information, active selection   |
| Success      | `--success` `#52775b`       | `--success-soft` `#e2eee5` | `#8fbd98`       | `#233329` | saved, connected, completed     |
| Warning      | `--warning` `#9d7630`       | `--warning-soft` `#f2ead7` | `#d6b46c`       | `#3a2f1c` | near limit, uncertain next step |
| Danger       | `--danger` `#9c493d`        | `--danger-soft` `#f2dfdb`  | `#dd8174`       | `#3b2523` | error, destruction, loss        |

Rules:

- Status uses at least text plus color; compact indicators also use an icon or shape.
- Red means error or destructive action only, not merely “important.”
- Yellow/amber means attention, not success.
- Green means confirmed success or healthy state, not a general primary action.
- Info uses the active accent, but must not look like an executable primary action.
- Test text/background combinations manually and automatically against WCAG. These values are the current contract, not a blanket contrast guarantee for every combination.

### Accent Palettes

In addition to `default`, the system provides `yellow`, `dark-green`, `pink`, `purple`, and `burgundy`, each in light and dark modes. A palette changes accents and related neutrals only; it never changes the meaning of Success, Warning, or Danger.

| Palette    | Mode  | Accent    | Strong    | Soft      | On accent |
| ---------- | ----- | --------- | --------- | --------- | --------- |
| Yellow     | Light | `#c3aa2f` | `#806c16` | `#f3edc7` | `#191506` |
| Yellow     | Dark  | `#d8c45f` | `#eadb82` | `#3b351d` | `#171408` |
| Dark Green | Light | `#2f7656` | `#1f5a3f` | `#e0eee7` | `#ffffff` |
| Dark Green | Dark  | `#72ad8d` | `#9fceb5` | `#20372b` | `#0b1710` |
| Pink       | Light | `#bf4f7c` | `#8f2e5a` | `#f4e2eb` | `#ffffff` |
| Pink       | Dark  | `#dc76a2` | `#efa6c4` | `#3d2431` | `#1b0b12` |
| Purple     | Light | `#7353ba` | `#573a97` | `#ebe4f8` | `#ffffff` |
| Purple     | Dark  | `#a386e4` | `#c2aefa` | `#302640` | `#130d1f` |
| Burgundy   | Light | `#8e3347` | `#6b2535` | `#f0dde3` | `#ffffff` |
| Burgundy   | Dark  | `#c7657a` | `#e897a8` | `#3a2028` | `#190a0f` |

### Board Colors

Board elements use these domain presets:

- `accent`
- `sage`
- `clay`
- `ink`
- `amber`
- note backgrounds additionally use `black` and `white`

Custom hex colors are user data and must pass central color normalization. They are not design-system tokens and must not style application chrome.

## Typography

### Families

- UI and content: `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Display/editorial: `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`

### Roles

| Role          | Recommendation                             | Use                              |
| ------------- | ------------------------------------------ | -------------------------------- |
| Display       | Serif, 28–48 px, 600–700                   | landing page, large empty states |
| Page title    | Serif or Sans by context, 24–32 px         | page titles                      |
| Section title | Sans, 18–22 px, 650–750                    | panels, dialogs                  |
| Body          | Sans, 16 px, 400–500, line-height 1.5–1.65 | standard text                    |
| UI label      | Sans, 13–14 px, 650–750                    | buttons, labels, navigation      |
| Metadata      | Sans, 12–13 px, 500–650                    | date, type, helper text          |

Body text and important controls must not fall below 12 px on regular viewports. Sizes around `0.64rem` are acceptable only for non-critical short labels and should gradually move to at least 12 px.

## Geometry

### Existing Base Tokens

- Control radius: `7px`
- Card radius: `7px`
- Panel radius: `8px`
- Small shadows: `--shadow-sm`
- Floating panels: `--shadow-md`
- Dialog/overlay: `--shadow-lg`

Additional radii require a named role. Use `999px` pills only for badges, avatars, segmented controls, or short action chips.

### Target Spacing Scale

New components follow a 4 px base:

| Token        | Value  |
| ------------ | ------ |
| `--space-1`  | `4px`  |
| `--space-2`  | `8px`  |
| `--space-3`  | `12px` |
| `--space-4`  | `16px` |
| `--space-5`  | `20px` |
| `--space-6`  | `24px` |
| `--space-8`  | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |

These are target tokens and still need central implementation. Until then, the same direct values are acceptable; new intermediate values require a layout rationale.

## Component Conventions

### Buttons

- Primary: accent fill with `on-accent`; one primary action per tight context.
- Secondary: raised surface with a border.
- Ghost: transparent for toolbars and low-priority actions.
- Danger: danger fill only for the confirmed destructive action; its initial trigger may remain neutral.
- Icon-only: at least 36 × 36 px, preferably 44 × 44 px on touch surfaces, always with an accessible name.
- Disabled is not the only explanation; provide a reason for limits.

### Inputs

- Keep labels visible; placeholders do not replace labels.
- Show errors at the field and associate them programmatically.
- Focus uses the global accent ring.
- Use consistent heights and the control radius.
- Search, URL, email, and numeric values use appropriate native input types and autocomplete.

### Cards and Pins

- Raised surface, fine border, small radius.
- Selection uses an accent edge/ring plus an optional icon, never a subtle color shift alone.
- Content determines height; metadata remains secondary.
- Drag state, drop target, and persisted state are visually distinguishable.

### Dialogs and Panels

- An overlay darkens and calms the background.
- A dialog has a title, optional description, body, and clearly separated actions.
- Initial focus is meaningful; Escape closes when no data loss occurs; focus returns to the trigger.
- Destructive confirmation names the concrete object and consequence.

### Snackbars and Banners

- Snackbar: short-lived, non-blocking outcome with an optional action.
- Banner: persistent contextual state that may include explanatory text.
- Errors explain what happened and the available next step.
- Critical errors do not disappear automatically as the only presentation.

## Interaction and Motion

- Default easing: `--ease-soft`.
- Playful spatial motion may use `--ease-spring`.
- Microinteractions: approximately 120–240 ms.
- Panels/dialogs: approximately 180–260 ms.
- Animation never blocks input or obscures persisted state.
- `prefers-reduced-motion: reduce` effectively removes animation and transition.
- Drag/resize shows the start, valid target, invalid target, and commit/rollback.

## Responsive Contract

The current structural breakpoint is `760px`: the desktop sidebar and workspace stack on mobile.

- Desktop: sidebar plus flexible workspace.
- Mobile: navigation consumes no horizontal workspace; important actions stay reachable.
- Board manipulation has touch and non-drag alternatives.
- No fixed width may force whole-app horizontal scrolling.
- Use `100dvh` for app shells, but test mobile browsers and the on-screen keyboard.

## Accessibility Contract

- Target: WCAG 2.2 AA.
- Complete keyboard operation with visible focus.
- 200% zoom without loss of function.
- Contrast testing for every theme/status combination.
- Prefer semantic HTML over ARIA reconstruction.
- Use live regions only for relevant asynchronous changes.
- Drag-and-drop and canvas positioning have describable, keyboard-operable alternatives.
- Icons supplement text or have an accessible name; decorative icons are hidden.

## Code Contract

- Theme-aware components use only semantic CSS custom properties.
- Do not add raw colors outside theme definitions, user data, and documented image/board motifs.
- Component styles remain encapsulated; global styles define only resets, tokens, and true primitives.
- New z-index values follow a scale: content, sticky navigation, popover, snackbar, dialog, critical overlay.
- Every new primitive demonstrates Light, Dark, Focus, Disabled, Error, and Mobile states in a visual test page or story.

## Open Design-System Debt

1. Add spacing, typography, control-height, and z-index tokens to the code.
2. Consolidate Button, Field, Dialog, Card, Badge, Banner, and Snackbar primitives.
3. Inventory raw colors and replace them with semantic tokens.
4. Test theme contrast automatically.
5. Add visual regression tests for core components and board states.
