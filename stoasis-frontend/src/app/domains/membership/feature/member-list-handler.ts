import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MembershipService } from '../data/application/membership.service';
import { MemberListComponent } from '../ui/member-list';
import { InviteDialogHandlerComponent } from './invite-dialog-handler';
import { ConfirmationDialogService } from '../../../shared/application/confirmation-dialog.service';
import { Role } from '../../../shared/models/role';

/** Coordinates board members, role changes and invitations. */
@Component({
  selector: 'feature-member-list-handler',
  standalone: true,
  imports: [MemberListComponent, InviteDialogHandlerComponent],
  template: `
    <ui-member-list
      [members]="membership.members()"
      [currentUserRole]="membership.currentUserRole()"
      [canManage]="membership.canManageMembers()"
      [error]="membership.error()"
      [isMutating]="membership.isMutating()"
      [limitReason]="membership.invite()?.capacity?.limitReason ?? null"
      (onRoleChange)="changeRole($event.userId, $event.role)"
      (onRemove)="remove($event)"
      (onInviteClick)="openInvite()"
      (onBack)="back()"
    />
    <feature-invite-dialog-handler
      [collectionId]="collectionId"
      [isOpen]="inviteOpen()"
      (onClose)="inviteOpen.set(false)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberListHandlerComponent {
  protected readonly membership = inject(MembershipService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationDialogService);
  readonly collectionId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly inviteOpen = signal(false);
  constructor() {
    this.membership.loadMembers(this.collectionId);
    this.membership.loadInvite(this.collectionId);
  }
  changeRole(userId: string, role: Role): void {
    this.membership.updateRole(this.collectionId, userId, role);
  }
  async remove(userId: string): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'membership.removeTitle',
      message: 'membership.confirmRemove',
      confirmLabel: 'common.remove',
      tone: 'danger',
    });
    if (confirmed) this.membership.removeMember(this.collectionId, userId);
  }
  openInvite(): void {
    this.membership.loadInvite(this.collectionId);
    this.inviteOpen.set(true);
  }
  back(): void {
    void this.router.navigate(['/collections', this.collectionId]);
  }
}
