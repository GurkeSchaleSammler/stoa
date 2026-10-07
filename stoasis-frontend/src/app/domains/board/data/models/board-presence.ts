export interface BoardCursorPosition {
  x: number;
  y: number;
}

export interface BoardParticipant {
  userId: string;
  name: string;
  cursor: BoardCursorPosition | null;
}

export type BoardPresenceStatus =
  'idle' | 'connecting' | 'connected' | 'reconnecting' | 'unavailable';

export function boardCursorColor(userId: string): string {
  const colors = ['var(--accent)', 'var(--sage)', 'var(--amber)', 'var(--text)'];
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return colors[(hash >>> 0) % colors.length];
}

/** Board pixels, independent of the viewer's zoom and scroll offset. */
export function boardCursorPosition(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  width: number,
  height: number,
): BoardCursorPosition | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = ((clientX - rect.left) / rect.width) * width;
  const y = ((clientY - rect.top) / rect.height) * height;
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x <= width && y <= height
    ? { x: Math.round(x), y: Math.round(y) }
    : null;
}
