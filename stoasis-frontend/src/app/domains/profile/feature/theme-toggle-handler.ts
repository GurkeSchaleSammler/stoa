import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PrefsStore } from '../data/application/prefs.store';
import { ThemeToggleComponent } from '../ui/profile-components';

@Component({
  selector: 'feature-theme-toggle-handler',
  standalone: true,
  imports: [ThemeToggleComponent],
  template: `<ui-theme-toggle [theme]="prefs.theme()" (onThemeChange)="prefs.setTheme($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleHandlerComponent {
  protected readonly prefs = inject(PrefsStore);
}
