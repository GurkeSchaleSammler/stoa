import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

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
