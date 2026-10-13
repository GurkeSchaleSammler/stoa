/** Preserve normal text copying, editing, browser commands and modal controls. */
export function boardShortcut(
  event: KeyboardEvent,
  hasTextSelection: boolean,
): 'copy' | 'paste' | null {
  if (
    !(event.ctrlKey || event.metaKey) ||
    event.altKey ||
    event.shiftKey ||
    event.defaultPrevented ||
    hasTextSelection
  )
    return null;
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable="true"], dialog[open]')
  )
    return null;
  const key = event.key.toLowerCase();
  return key === 'c' ? 'copy' : key === 'v' ? 'paste' : null;
}
