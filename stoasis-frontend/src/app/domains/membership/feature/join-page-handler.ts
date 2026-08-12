import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MembershipService } from '../data/application/membership.service';
import { JoinPageComponent } from '../ui/membership-components';

@Component({
  selector: 'feature-join-page-handler',
  standalone: true,
  imports: [JoinPageComponent],
  template: `<ui-join-page
    [status]="joinStatus()"
    [collectionName]="membership.invite()?.collectionName || ''"
    [error]="membership.error()"
    (onConfirmJoin)="join()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPageHandlerComponent {
  protected readonly membership = inject(MembershipService);
  private readonly route = inject(ActivatedRoute);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';
  readonly joinStatus = computed<'loading' | 'idle' | 'joining' | 'error'>(() => {
    if (this.membership.error()) return 'error';
    if (this.membership.isMutating()) return 'joining';
    return this.membership.isLoading() ? 'loading' : 'idle';
  });
  constructor() {
    this.membership.loadInvitePreview(this.token);
  }
  join(): void {
    this.membership.joinViaToken(this.token);
  }
}
