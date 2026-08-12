export const appLanguageStorageKey = 'app-language';
export const defaultAppLanguage = 'de';

export const supportedAppLanguages = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
] as const;

export type AppLanguage = (typeof supportedAppLanguages)[number]['code'];

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return supportedAppLanguages.some((language) => language.code === value);
}
