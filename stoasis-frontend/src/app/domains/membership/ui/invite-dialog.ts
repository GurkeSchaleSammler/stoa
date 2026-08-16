import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { InviteInfo } from '../data/models/invite-info';

@Component({
  selector: 'ui-invite-dialog',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    @if (isOpen()) {
      <div class="dialog-backdrop" (click)="onClose.emit()">
        <section
          class="invite-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          (click)="$event.stopPropagation()"
        >
          <header>
            <div>
              <p class="eyebrow">{{ 'common.share' | translate }}</p>
              <h1 id="invite-title">{{ 'membership.inviteTitle' | translate }}</h1>
            </div>
            <button
              type="button"
              class="close-button"
              (click)="onClose.emit()"
              [attr.aria-label]="'common.close' | translate"
            >
              <ui-app-icon name="close" />
            </button>
          </header>
          @if (invite(); as data) {
            <p>{{ 'membership.inviteLead' | translate }}</p>
            @if (data.visibility === 'link') {
              <div class="invite-link">
                <code>{{ data.url }}</code
                ><button type="button" (click)="onCopyLink.emit()">
                  <ui-app-icon [name]="copied() ? 'check' : 'copy'" />
                  {{ (copied() ? 'common.copied' : 'common.copy') | translate }}
                </button>
              </div>
              <button type="button" class="text-danger" (click)="onRevokeInvite.emit()">
                {{ 'membership.revokeLink' | translate }}
              </button>
            } @else {
              <div class="private-state">
                <span><ui-app-icon name="warning" /></span
                ><strong>{{ 'membership.privateCollection' | translate }}</strong
                ><button type="button" class="button primary" (click)="onEnableInvite.emit()">
                  {{ 'membership.createInviteLink' | translate }}
                </button>
              </div>
            }
          }
        </section>
      </div>
    }
  `,
  styleUrl: './membership.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteDialogComponent {
  readonly isOpen = input(false);
  readonly invite = input<InviteInfo | null>(null);
  readonly copied = input(false);
  readonly onCopyLink = output<void>();
  readonly onRevokeInvite = output<void>();
  readonly onEnableInvite = output<void>();
  readonly onClose = output<void>();
}
