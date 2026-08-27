export const BOARD_COLOR_PRESETS = ['accent', 'sage', 'clay', 'ink', 'amber'] as const;

export type BoardColorPreset = (typeof BOARD_COLOR_PRESETS)[number];
export type BoardColor = BoardColorPreset | string;

const PRESET_CSS_COLORS: Record<BoardColorPreset, string> = {
  accent: 'var(--accent)',
  sage: 'var(--sage)',
  clay: 'color-mix(in srgb, var(--amber) 72%, var(--danger))',
  ink: 'var(--text)',
  amber: 'var(--amber)',
};

const PRESET_NATIVE_COLORS: Record<BoardColorPreset, string> = {
  accent: '#7f8f6c',
  sage: '#6f8f72',
  clay: '#be7d4b',
  ink: '#2f342d',
  amber: '#d19a31',
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const HEX_COLOR_WITHOUT_HASH = /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeBoardColor(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (isBoardColorPreset(trimmed)) return trimmed;
  if (HEX_COLOR.test(trimmed)) return trimmed.toLowerCase();
  if (HEX_COLOR_WITHOUT_HASH.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

export function isBoardColorPreset(value: string | null | undefined): value is BoardColorPreset {
  return BOARD_COLOR_PRESETS.includes(value as BoardColorPreset);
}

export function isHexBoardColor(value: string | null | undefined): boolean {
  return Boolean(value && HEX_COLOR.test(value));
}

export function boardColorCssValue(
  value: string | null | undefined,
  fallback: BoardColorPreset = 'accent',
): string {
  const normalized = normalizeBoardColor(value);
  if (isBoardColorPreset(normalized)) return PRESET_CSS_COLORS[normalized];
  return normalized ?? PRESET_CSS_COLORS[fallback];
}

export function boardColorNativeValue(
  value: string | null | undefined,
  fallback: BoardColorPreset = 'accent',
): string {
  const normalized = normalizeBoardColor(value);
  if (isBoardColorPreset(normalized)) return PRESET_NATIVE_COLORS[normalized];
  return isHexBoardColor(normalized) ? normalized! : PRESET_NATIVE_COLORS[fallback];
}
