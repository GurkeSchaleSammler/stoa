import {
  boardColorCssValue,
  boardColorNativeValue,
  normalizeBoardColor,
} from './board-color';

describe('board colors', () => {
  it('keeps preset colors as semantic values', () => {
    expect(normalizeBoardColor('sage')).toBe('sage');
    expect(boardColorCssValue('amber')).toBe('var(--amber)');
  });

  it('normalizes custom hex colors with or without a hash', () => {
    expect(normalizeBoardColor('#86A873')).toBe('#86a873');
    expect(normalizeBoardColor('D94A4A')).toBe('#d94a4a');
    expect(boardColorNativeValue('d94a4a')).toBe('#d94a4a');
  });

  it('falls back for blank or invalid colors', () => {
    expect(normalizeBoardColor('')).toBeNull();
    expect(normalizeBoardColor('not-a-color')).toBeNull();
    expect(boardColorCssValue('not-a-color')).toBe('var(--accent)');
  });
});
