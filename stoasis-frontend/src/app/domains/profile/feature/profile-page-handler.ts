import { McpConnectionSectionComponent } from '../../mcp/mcp-connection-section';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, minLength, required } from '@angular/forms/signals';
import { ProfileService } from '../data/application/profile.service';
import { ProfilePageComponent } from '../ui/profile-page';
import { DangerZoneHandlerComponent } from './danger-zone-handler';
import { ImportExportHandlerComponent } from './import-export-handler';
import { ThemeToggleHandlerComponent } from './theme-toggle-handler';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileFormValue } from '../data/models/profile-form-value';

/** Combines account, portability and connection settings. */
@Component({
  selector: 'feature-profile-page-handler',
  standalone: true,
  imports: [
    McpConnectionSectionComponent,
    ProfilePageComponent,
    ImportExportHandlerComponent,
    ThemeToggleHandlerComponent,
    DangerZoneHandlerComponent,
    TranslatePipe,
  ],
  template: `
    <main class="profile-page">
      <header class="page-heading">
        <p>{{ 'common.settings' | translate }}</p>
        <h1>{{ 'profile.yourStoa' | translate }}</h1>
      </header>
      <div class="profile-stack">
        <ui-profile-page
          [user]="profile.user()"
          [formValue]="model()"
          [isSaving]="profile.isSaving()"
          [isDirty]="isDirty()"
          [error]="profile.error()"
          [success]="profile.success()"
          (onFieldChange)="model.set($event)"
          (onAvatarFile)="uploadAvatar($event)"
          (onSave)="save()"
        />
        <feature-import-export-handler />
        <feature-mcp-connection />
        <feature-theme-toggle-handler />
        <feature-danger-zone-handler />
      </div>
    </main>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: auto;
    }
    .profile-page {
      width: min(820px, calc(100% - 2 * clamp(16px, 3vw, 40px)));
      margin: 0 clamp(16px, 3vw, 40px);
      padding: 32px 0 48px;
    }
    .page-heading p {
      margin: 0;
      color: var(--accent-strong);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .page-heading h1 {
      margin: 5px 0 25px;
      font-family: var(--font-display);
      font-size: clamp(2rem, 6vw, 3.4rem);
      letter-spacing: -0.05em;
    }
    .profile-stack {
      display: flex;
      flex-direction: column;
      gap: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageHandlerComponent {
  protected readonly profile = inject(ProfileService);
  readonly model = signal<ProfileFormValue>({
    name: this.profile.user()?.name ?? '',
    avatarUrl: this.profile.user()?.avatarUrl ?? '',
  });
  readonly profileForm = form(this.model, (path) => {
    required(path.name);
    minLength(path.name, 2);
  });
  readonly isDirty = computed(() => {
    const user = this.profile.user();
    return (
      !!user &&
      (this.model().name.trim() !== user.name ||
        this.model().avatarUrl.trim() !== (user.avatarUrl ?? ''))
    );
  });

  save(): void {
    if (this.profileForm().valid() && this.isDirty()) {
      this.profile.updateProfile(
        {
          name: this.model().name.trim(),
          avatarUrl: this.model().avatarUrl.trim() || undefined,
        },
        () => {
          const user = this.profile.user();
          if (user) this.model.set({ name: user.name, avatarUrl: user.avatarUrl ?? '' });
        },
      );
    }
  }

  uploadAvatar(file: File): void {
    this.profile.uploadAvatar(file, (avatarUrl) =>
      this.model.update((value) => ({ ...value, avatarUrl })),
    );
  }
}
