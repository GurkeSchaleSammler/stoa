import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { Member } from '../data/models/member';
import { Role } from '../../../shared/models/role';

import { RoleBadgeComponent } from './role-badge';
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
