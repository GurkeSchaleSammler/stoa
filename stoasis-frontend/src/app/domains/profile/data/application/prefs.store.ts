import { computed, effect, Injectable, signal } from '@angular/core';
import { BoardViewMode } from '../../../../shared/models/core.models';
import {
  ColorPalette,
  colorPalettes,
  Preferences,
  ThemeMode,
  themeModes,
} from '../models/profile.models';

const defaultPreferences: Preferences = {
  theme: 'system',
  palette: 'default',
  defaultView: 'board',
};

@Injectable({ providedIn: 'root' })
export class PrefsStore {
  private readonly state = signal<Preferences>(this.read());
  readonly theme = computed(() => this.state().theme);
  readonly palette = computed(() => this.state().palette);
  readonly defaultView = computed(() => this.state().defaultView);
  constructor() {
    effect(() => localStorage.setItem('stoa-preferences', JSON.stringify(this.state())));
  }
  setTheme(theme: ThemeMode): void {
    this.state.update((s) => ({ ...s, theme }));
  }
  setPalette(palette: ColorPalette): void {
    this.state.update((s) => ({ ...s, palette }));
  }
  setDefaultView(defaultView: BoardViewMode): void {
    this.state.update((s) => ({ ...s, defaultView }));
  }
  private read(): Preferences {
    try {
      const saved = localStorage.getItem('stoa-preferences');
      if (!saved) return defaultPreferences;

      const parsed = JSON.parse(saved) as Partial<Preferences>;
      return {
        theme: themeModes.includes(parsed.theme as ThemeMode)
          ? (parsed.theme as ThemeMode)
          : defaultPreferences.theme,
        palette: colorPalettes.includes(parsed.palette as ColorPalette)
          ? (parsed.palette as ColorPalette)
          : defaultPreferences.palette,
        defaultView: ['board', 'list'].includes(parsed.defaultView ?? '')
          ? (parsed.defaultView as BoardViewMode)
          : defaultPreferences.defaultView,
      };
    } catch {
      return defaultPreferences;
    }
  }
}
