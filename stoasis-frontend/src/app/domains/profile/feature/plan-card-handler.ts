import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, tap } from 'rxjs';
import { SessionContextStore } from '../../../shared/application/session-context.store';
import { BillingService } from '../data/application/billing.service';
import { PlanCardComponent } from '../ui/profile-components';

@Component({
  selector: 'feature-plan-card-handler',
  standalone: true,
  imports: [PlanCardComponent],
  template: `<ui-plan-card
    [plan]="session.user()?.plan || 'free'"
    [isRedirecting]="isRedirecting()"
    (onManageBilling)="openBilling()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCardHandlerComponent {
  protected readonly session = inject(SessionContextStore);
  private readonly billing = inject(BillingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isRedirecting = signal(false);
  openBilling(): void {
    this.isRedirecting.set(true);
    this.billing
      .portalUrl()
      .pipe(
        tap(({ url }) => window.open(url, '_blank', 'noopener')),
        finalize(() => this.isRedirecting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
