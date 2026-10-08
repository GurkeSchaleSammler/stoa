import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmationDialogService } from '../application/confirmation-dialog.service';
import { SnackbarService } from '../application/snackbar.service';
import { AppIconComponent } from './app-icon';

@Component({
  selector: 'ui-feedback-overlay',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <section
      class="snackbar-stack"
      aria-live="polite"
      [attr.aria-label]="'feedback.notifications' | translate"
    >
      @for (message of snackbars.messages(); track message.id) {
        <article
          class="snackbar"
          [class]="'snackbar ' + message.tone"
          role="status"
          animate.leave="snackbar-leave"
        >
          <ui-app-icon
            [name]="
              message.tone === 'success' ? 'check' : message.tone === 'error' ? 'warning' : 'note'
            "
          />
          <span>{{ message.message | translate: message.params }}</span>
          @if (message.actionLabel) {
            <button type="button" class="snackbar-action" (click)="snackbars.runAction(message)">
              {{ message.actionLabel | translate }}
            </button>
          }
          <button
            type="button"
            [attr.aria-label]="'common.close' | translate"
            (click)="snackbars.dismiss(message.id)"
          >
            <ui-app-icon name="close" />
          </button>
        </article>
      }
    </section>

    @if (dialog.request(); as request) {
      <div class="dialog-backdrop" (click)="dialog.cancel()">
        <section
          class="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          (click)="$event.stopPropagation()"
        >
          <span class="confirm-icon" [class.danger]="request.tone === 'danger'">
            <ui-app-icon [name]="request.tone === 'danger' ? 'warning' : 'note'" />
          </span>
          <div>
            <h2 id="confirm-title">{{ request.title | translate }}</h2>
            <p id="confirm-message">{{ request.message | translate }}</p>
          </div>
          <footer>
            <button type="button" class="button secondary" (click)="dialog.cancel()">
              {{ request.cancelLabel | translate }}
            </button>
            <button
              type="button"
              class="button"
              [class.danger]="request.tone === 'danger'"
              (click)="dialog.accept()"
            >
              {{ request.confirmLabel | translate }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styleUrl: './feedback-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackOverlayComponent {
  protected readonly snackbars = inject(SnackbarService);
  protected readonly dialog = inject(ConfirmationDialogService);
}
