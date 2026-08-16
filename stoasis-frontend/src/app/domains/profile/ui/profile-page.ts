import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { ProfileFormValue } from '../data/models/profile-form-value';
import { User } from '../../../shared/models/user';

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
