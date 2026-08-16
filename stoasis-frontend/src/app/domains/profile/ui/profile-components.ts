import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent, AppIconName } from '../../../shared/ui/app-icon';
import { ThemeMode } from '../data/models/theme-mode';
import { ProfileFormValue } from '../data/models/profile-form-value';
import { ImportResult } from '../data/models/import-result';
import { ExportFormat } from '../data/models/export-format';
import { ColorPalette } from '../data/models/color-palette';
import { User } from '../../../shared/models/user';
import { Plan } from '../../../shared/models/plan';

@Component({
  selector: 'ui-profile-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `<section class="profile-card">
    <header>
      <div>
        <p class="eyebrow">{{ 'profile.yourAccount' | translate }}</p>
        <h1>{{ 'common.profile' | translate }}</h1>
      </div>
      <div class="avatar-editor">
        <span class="profile-avatar">
          @if (formValue().avatarUrl) {
            <img [src]="formValue().avatarUrl" [alt]="'profile.avatarAlt' | translate" />
          } @else {
            {{ user()?.name?.slice(0, 1) || 'S' }}
          }
        </span>
        <label class="avatar-upload button secondary">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="selectAvatar($event)"
          />
          <ui-app-icon name="upload" />
          {{ 'profile.chooseAvatar' | translate }}
        </label>
      </div>
    </header>
    @if (error()) {
      <p class="error-banner">{{ error() | translate }}</p>
    }
    @if (success()) {
      <p class="success-banner">{{ success() | translate }}</p>
    }
    <label
      ><span>{{ 'common.name' | translate }}</span
      ><input
        [ngModel]="formValue().name"
        (ngModelChange)="onFieldChange.emit({ name: $event, avatarUrl: formValue().avatarUrl })"
    /></label>
    <div class="card-actions">
      <span>{{ user()?.email }}</span
      ><button
        type="button"
        class="button primary"
        [disabled]="!isDirty() || isSaving()"
        (click)="onSave.emit()"
      >
        {{ (isSaving() ? 'common.saving' : 'profile.saveChanges') | translate }}
      </button>
    </div>
  </section>`,
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  readonly user = input<User | null>(null);
  readonly formValue = input.required<ProfileFormValue>();
  readonly isSaving = input(false);
  readonly isDirty = input(false);
  readonly error = input<string | null>(null);
  readonly success = input<string | null>(null);
  readonly onFieldChange = output<ProfileFormValue>();
  readonly onAvatarFile = output<File>();
  readonly onSave = output<void>();
  selectAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.onAvatarFile.emit(file);
    input.value = '';
  }
}

@Component({
  selector: 'ui-plan-card',
  standalone: true,
  imports: [TranslatePipe],
  template: `<section class="settings-section">
    <div>
      <p class="eyebrow">{{ 'profile.subscription' | translate }}</p>
      <h2>{{ plan() === 'premium' ? 'Stoa Premium' : 'Stoa Free' }}</h2>
      <p>
        {{
          plan() === 'premium'
            ? ('profile.premiumLead' | translate)
            : ('profile.freeLead' | translate)
        }}
      </p>
    </div>
    <button
      type="button"
      class="button secondary"
      [disabled]="isRedirecting()"
      (click)="onManageBilling.emit()"
    >
      {{ (isRedirecting() ? 'profile.openingPortal' : 'profile.manageSubscription') | translate }}
    </button>
  </section>`,
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCardComponent {
  readonly plan = input<Plan>('free');
  readonly isRedirecting = input(false);
  readonly onManageBilling = output<void>();
}

@Component({
  selector: 'ui-import-export',
  standalone: true,
  imports: [TranslatePipe],
  template: `<section class="settings-section stack">
    <div>
      <p class="eyebrow">{{ 'profile.data' | translate }}</p>
      <h2>{{ 'profile.importExport' | translate }}</h2>
      <p>{{ 'profile.importExportLead' | translate }}</p>
    </div>
    <div class="data-actions">
      <label class="button secondary file-button"
        ><input type="file" accept=".csv,text/csv" (change)="selectFile($event)" />{{
          (isImporting() ? 'profile.importing' : 'profile.importPocket') | translate
        }}</label
      ><button
        type="button"
        class="button secondary"
        [disabled]="isExporting()"
        (click)="onExport.emit('json')"
      >
        {{ 'profile.exportJson' | translate }}</button
      ><button
        type="button"
        class="button secondary"
        [disabled]="isExporting()"
        (click)="onExport.emit('csv')"
      >
        {{ 'profile.exportCsv' | translate }}
      </button>
    </div>
    @if (importResult(); as result) {
      <div class="import-result">
        <strong>{{ 'profile.importedCount' | translate: { count: result.imported } }}</strong
        ><span>{{ 'profile.skippedCount' | translate: { count: result.skipped } }}</span>
        @for (error of result.errors; track error) {
          <small>{{ error }}</small>
        }
      </div>
    }
  </section>`,
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportComponent {
  readonly importResult = input<ImportResult | null>(null);
  readonly isImporting = input(false);
  readonly isExporting = input(false);
  readonly onImportFile = output<File>();
  readonly onExport = output<ExportFormat>();
  selectFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.onImportFile.emit(file);
  }
}

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

@Component({
  selector: 'ui-danger-zone',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `<section class="settings-section danger-zone">
    <div>
      <p class="eyebrow">{{ 'profile.dangerZone' | translate }}</p>
      <h2>{{ 'profile.deleteAccount' | translate }}</h2>
      <p>{{ 'profile.deleteAccountLead' | translate }}</p>
    </div>
    <div>
      <label
        ><span
          >{{ 'profile.confirmDeleteBefore' | translate }}
          <strong>{{ confirmationText() }}</strong>
          {{ 'profile.confirmDeleteAfter' | translate }}</span
        ><input
          [ngModel]="confirmText"
          (ngModelChange)="confirmText = $event; onConfirmTextChange.emit($event)" /></label
      ><button
        type="button"
        class="button danger"
        [disabled]="!canConfirmDelete()"
        (click)="onDeleteAccount.emit()"
      >
        {{ 'profile.deleteAccount' | translate }}</button
      ><button type="button" class="logout-link" (click)="onLogout.emit()">
        {{ 'common.logout' | translate }}
      </button>
    </div>
  </section>`,
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DangerZoneComponent {
  readonly canConfirmDelete = input(false);
  readonly confirmationText = input.required<string>();
  readonly onConfirmTextChange = output<string>();
  readonly onDeleteAccount = output<void>();
  readonly onLogout = output<void>();
  confirmText = '';
}
