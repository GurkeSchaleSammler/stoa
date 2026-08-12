import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from './app-icon';

@Component({
  selector: 'ui-status-banner',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) {
      <div class="status-banner" [class]="'status-banner ' + tone()" role="status">
        <span>{{ message() | translate }}</span>
        @if (dismissible()) {
          <button
            type="button"
            [attr.aria-label]="'common.dismissNotice' | translate"
            (click)="onDismiss.emit()"
          >
            <ui-app-icon name="close" />
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .status-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.875rem;
      background: var(--accent-soft);
      color: var(--accent-strong);
    }
    .status-banner.error {
      background: var(--danger-soft);
      color: var(--danger);
    }
    .status-banner.success {
      background: var(--success-soft);
      color: var(--success);
    }
    span {
      flex: 1;
    }
    button {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    button ui-app-icon {
      width: 19px;
      height: 19px;
    }
  `,
})
export class StatusBannerComponent {
  readonly message = input<string | null>(null);
  readonly tone = input<'info' | 'error' | 'success'>('info');
  readonly dismissible = input(false);
  readonly onDismiss = output<void>();
}
