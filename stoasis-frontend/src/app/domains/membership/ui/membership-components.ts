import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { InviteInfo, Member, Role } from '../data/models/membership.models';

@Component({
  selector: 'ui-role-badge',
  standalone: true,
  imports: [TranslatePipe],
  template: `<span class="role-badge" [class]="'role-badge ' + role()">{{
    'role.' + role() | translate
  }}</span>`,
  styleUrl: './membership.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleBadgeComponent {
  readonly role = input.required<Role>();
}

@Component({
  selector: 'ui-member-list',
  standalone: true,
  imports: [FormsModule, RoleBadgeComponent, TranslatePipe, AppIconComponent],
  template: `
    <section class="member-card" aria-labelledby="member-title">
      <header>
        <div>
          <p class="eyebrow">{{ 'membership.collaboration' | translate }}</p>
          <h1 id="member-title">{{ 'membership.members' | translate }}</h1>
          <p>{{ 'membership.rolesLead' | translate }}</p>
        </div>
        <button type="button" class="button secondary" (click)="onBack.emit()">
          {{ 'membership.backToBoard' | translate }}
        </button>
      </header>
      @if (error()) {
        <p class="error-banner" role="alert">{{ error() | translate }}</p>
      }
      <div class="member-toolbar">
        <span>{{ 'membership.memberCount' | translate: { count: members().length } }}</span>
        @if (canManage()) {
          <button type="button" class="button primary" (click)="onInviteClick.emit()">
            {{ 'membership.inviteLink' | translate }}
          </button>
        }
      </div>
      <div class="member-list">
        @for (member of members(); track member.userId) {
          <article>
            <span class="avatar">
              @if (member.avatarUrl) {
                <img [src]="member.avatarUrl" alt="" />
              } @else {
                {{ member.name.slice(0, 1) }}
              }
            </span>
            <div class="member-copy">
              <strong>{{ member.name }}</strong
              ><small>{{ member.email }}</small>
            </div>
            @if (canManage()) {
              <label class="role-select"
                ><span class="sr-only">
                  {{ 'membership.roleOf' | translate: { name: member.name } }} </span
                ><select
                  [ngModel]="member.role"
                  (ngModelChange)="onRoleChange.emit({ userId: member.userId, role: $event })"
                >
                  <option value="owner">{{ 'role.owner' | translate }}</option>
                  <option value="editor">{{ 'role.editor' | translate }}</option>
                  <option value="viewer">{{ 'role.viewer' | translate }}</option>
                </select></label
              >
              <button
                type="button"
                class="remove-button"
                [attr.aria-label]="'membership.removeMember' | translate: { name: member.name }"
                (click)="onRemove.emit(member.userId)"
              >
                <ui-app-icon name="close" />
              </button>
            } @else {
              <ui-role-badge [role]="member.role" />
            }
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './membership.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberListComponent {
  readonly members = input.required<Member[]>();
  readonly currentUserRole = input<Role | null>(null);
  readonly canManage = input(false);
  readonly error = input<string | null>(null);
  readonly onRoleChange = output<{ userId: string; role: Role }>();
  readonly onRemove = output<string>();
  readonly onInviteClick = output<void>();
  readonly onBack = output<void>();
}

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

@Component({
  selector: 'ui-join-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="join-card">
      <div class="join-mark"><img src="/android-chrome-192x192.png" alt="" /></div>
      <p class="eyebrow">{{ 'membership.invitation' | translate }}</p>
      @if (status() === 'loading') {
        <h1>{{ 'membership.checkingInvite' | translate }}</h1>
      } @else if (status() === 'error') {
        <h1>{{ 'membership.invalidInvite' | translate }}</h1>
        <p class="error-banner">{{ error() | translate }}</p>
      } @else {
        <h1>{{ 'membership.joinTitle' | translate }}</h1>
        <p>
          {{ 'membership.joinBeforeName' | translate }}
          <strong>{{ collectionName() }}</strong>
          {{ 'membership.joinAfterName' | translate }}
        </p>
        <button
          type="button"
          class="button primary wide"
          [disabled]="status() === 'joining'"
          (click)="onConfirmJoin.emit()"
        >
          {{ (status() === 'joining' ? 'membership.joining' : 'membership.join') | translate }}
        </button>
      }
    </section>
  `,
  styleUrl: './membership.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPageComponent {
  readonly status = input<'loading' | 'idle' | 'joining' | 'error'>('loading');
  readonly collectionName = input('');
  readonly error = input<string | null>(null);
  readonly onConfirmJoin = output<void>();
}
