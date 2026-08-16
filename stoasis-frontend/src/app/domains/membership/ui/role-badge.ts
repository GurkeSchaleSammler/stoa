import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Role } from '../../../shared/models/role';

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
