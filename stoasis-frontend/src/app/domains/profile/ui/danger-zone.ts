import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

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
