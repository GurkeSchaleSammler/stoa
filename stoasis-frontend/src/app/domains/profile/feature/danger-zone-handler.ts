import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ProfileService } from '../data/application/profile.service';
import { DangerZoneComponent } from '../ui/danger-zone';
import { TranslationService } from '../../../shared/application/translation-service';
import { ConfirmationDialogService } from '../../../shared/application/confirmation-dialog.service';

@Component({
  selector: 'feature-danger-zone-handler',
  standalone: true,
  imports: [DangerZoneComponent],
  template: `<ui-danger-zone
    [canConfirmDelete]="canDelete()"
    [confirmationText]="confirmationText()"
    (onConfirmTextChange)="confirmText.set($event)"
    (onDeleteAccount)="deleteAccount()"
    (onLogout)="profile.logout()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DangerZoneHandlerComponent {
  protected readonly profile = inject(ProfileService);
  private readonly i18n = inject(TranslationService);
  private readonly confirmation = inject(ConfirmationDialogService);
  readonly confirmText = signal('');
  readonly confirmationText = computed(() => this.i18n.translate('profile.deleteConfirmationText'));
  readonly canDelete = computed(() => this.confirmText() === this.confirmationText());
  async deleteAccount(): Promise<void> {
    if (!this.canDelete()) return;
    const confirmed = await this.confirmation.confirm({
      title: 'profile.deleteAccount',
      message: 'profile.confirmDeleteAccount',
      confirmLabel: 'profile.deleteAccount',
      tone: 'danger',
    });
    if (confirmed) this.profile.deleteAccount();
  }
}
