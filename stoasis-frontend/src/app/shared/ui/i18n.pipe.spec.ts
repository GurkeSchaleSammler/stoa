import { I18nPipe } from './i18n.pipe';

describe('I18nPipe', () => {
  const value = {
    de: 'Deutsch',
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
  };

  it('returns the requested language', () => {
    expect(new I18nPipe().transform(value, 'fr')).toBe('Français');
  });

  it('falls back to the default language', () => {
    expect(new I18nPipe().transform(value, 'unknown')).toBe('Deutsch');
  });

  it('returns an empty string for missing values', () => {
    expect(new I18nPipe().transform(null, 'de')).toBe('');
  });
});
