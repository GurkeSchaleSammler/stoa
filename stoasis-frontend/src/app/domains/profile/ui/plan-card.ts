import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Plan } from '../../../shared/models/plan';

@Component({
  selector: 'ui-plan-card',
  standalone: true,
  imports: [TranslatePipe],
  template: `<section class="settings-section">
    <div>
      <p class="eyebrow">{{ 'profile.subscription' | translate }}</p>
      <h2>{{ plan() === 'premium' ? 'Stoa Premium' : 'Stoa Free' }}</h2>
      <p>
        {{
          plan() === 'premium'
            ? ('profile.premiumLead' | translate)
            : ('profile.freeLead' | translate)
        }}
      </p>
    </div>
    <button
      type="button"
      class="button secondary"
      [disabled]="isRedirecting()"
      (click)="onManageBilling.emit()"
    >
      {{ (isRedirecting() ? 'profile.openingPortal' : 'profile.manageSubscription') | translate }}
    </button>
  </section>`,
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCardComponent {
  readonly plan = input<Plan>('free');
  readonly isRedirecting = input(false);
  readonly onManageBilling = output<void>();
}
