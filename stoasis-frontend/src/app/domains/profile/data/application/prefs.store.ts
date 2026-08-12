import { computed, effect, Injectable, signal } from '@angular/core';
import { BoardViewMode } from '../../../../shared/models/core.models';
import { Preferences, Theme } from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class PrefsStore {
  private readonly state = signal<Preferences>(this.read());
  readonly theme = computed(() => this.state().theme);
  readonly defaultView = computed(() => this.state().defaultView);
  constructor() {
    effect(() => localStorage.setItem('stoa-preferences', JSON.stringify(this.state())));
  }
  setTheme(theme: Theme): void {
    this.state.update((s) => ({ ...s, theme }));
  }
  setDefaultView(defaultView: BoardViewMode): void {
    this.state.update((s) => ({ ...s, defaultView }));
  }
  private read(): Preferences {
    try {
      const saved = localStorage.getItem('stoa-preferences');
      return saved ? (JSON.parse(saved) as Preferences) : { theme: 'system', defaultView: 'board' };
    } catch {
      return { theme: 'system', defaultView: 'board' };
    }
  }
}
