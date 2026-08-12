import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { MembershipService } from '../data/application/membership.service';
import { InviteDialogComponent } from '../ui/membership-components';

@Component({
  selector: 'feature-invite-dialog-handler',
  standalone: true,
  imports: [InviteDialogComponent],
  template: `
    <ui-invite-dialog
      [isOpen]="isOpen()"
      [invite]="membership.invite()"
      [copied]="copied()"
      (onCopyLink)="copyLink()"
      (onRevokeInvite)="membership.setInviteVisibility(collectionId(), 'private')"
      (onEnableInvite)="membership.setInviteVisibility(collectionId(), 'link')"
      (onClose)="onClose.emit()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteDialogHandlerComponent {
  protected readonly membership = inject(MembershipService);
  readonly collectionId = input.required<string>();
  readonly isOpen = input(false);
  readonly onClose = output<void>();
  readonly copied = signal(false);

  copyLink(): void {
    const url = this.membership.invite()?.url;
    if (url) void navigator.clipboard.writeText(url).then(() => this.copied.set(true));
  }
}
