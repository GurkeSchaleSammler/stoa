import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { AppIconName } from '../../../shared/models/app-icon-name';
import { ThemeMode } from '../data/models/theme-mode';
import { ColorPalette } from '../data/models/color-palette';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `<section class="settings-section stack appearance-settings">
    <div>
      <p class="eyebrow">{{ 'profile.appearance' | translate }}</p>
      <h2>{{ 'profile.theme' | translate }}</h2>
      <p>{{ 'profile.themeLead' | translate }}</p>
    </div>
    <div class="appearance-controls">
      <div class="appearance-control">
        <div>
          <strong>{{ 'profile.palette' | translate }}</strong>
          <small>{{ 'profile.paletteLead' | translate }}</small>
        </div>
        <div class="palette-options" role="group" [attr.aria-label]="'profile.palette' | translate">
          @for (option of paletteOptions; track option.value) {
            <button
              type="button"
              [attr.data-palette]="option.value"
              [class.active]="palette() === option.value"
              [attr.aria-pressed]="palette() === option.value"
              (click)="onPaletteChange.emit(option.value)"
            >
              <span class="palette-swatch" aria-hidden="true"><i></i><i></i><i></i></span>
              {{ option.labelKey | translate }}
            </button>
          }
        </div>
      </div>
      <div class="appearance-control">
        <div>
          <strong>{{ 'profile.mode' | translate }}</strong>
          <small>{{ 'profile.modeLead' | translate }}</small>
        </div>
        <div class="theme-options" role="group" [attr.aria-label]="'profile.mode' | translate">
          @for (option of modeOptions; track option.value) {
            <button
              type="button"
              [class.active]="theme() === option.value"
              [attr.aria-pressed]="theme() === option.value"
              (click)="onThemeChange.emit(option.value)"
            >
              <ui-app-icon [name]="option.icon" />
              {{ option.labelKey | translate }}
            </button>
          }
        </div>
      </div>
    </div>
  </section>`,
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  readonly theme = input<ThemeMode>('system');
  readonly palette = input<ColorPalette>('default');
  readonly onThemeChange = output<ThemeMode>();
  readonly onPaletteChange = output<ColorPalette>();
  readonly modeOptions: { value: ThemeMode; labelKey: string; icon: AppIconName }[] = [
    { value: 'light', labelKey: 'profile.light', icon: 'sun' },
    { value: 'dark', labelKey: 'profile.dark', icon: 'moon' },
    { value: 'system', labelKey: 'profile.system', icon: 'monitor' },
  ];
  readonly paletteOptions: { value: ColorPalette; labelKey: string }[] = [
    { value: 'default', labelKey: 'profile.paletteDefault' },
    { value: 'yellow', labelKey: 'profile.paletteYellow' },
    { value: 'dark-green', labelKey: 'profile.paletteDarkGreen' },
    { value: 'pink', labelKey: 'profile.palettePink' },
    { value: 'purple', labelKey: 'profile.palettePurple' },
    { value: 'burgundy', labelKey: 'profile.paletteBurgundy' },
  ];
}
