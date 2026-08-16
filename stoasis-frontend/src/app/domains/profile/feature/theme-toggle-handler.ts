import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PrefsStore } from '../data/application/prefs.store';
import { ThemeToggleComponent } from '../ui/theme-toggle';

@Component({
  selector: 'feature-theme-toggle-handler',
  standalone: true,
  imports: [ThemeToggleComponent],
  template: `<ui-theme-toggle
    [theme]="prefs.theme()"
    [palette]="prefs.palette()"
    (onThemeChange)="prefs.setTheme($event)"
    (onPaletteChange)="prefs.setPalette($event)"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleHandlerComponent {
  protected readonly prefs = inject(PrefsStore);
}
