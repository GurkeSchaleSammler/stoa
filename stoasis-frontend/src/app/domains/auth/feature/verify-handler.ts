import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VerifyComponent } from '../ui/verify/verify';
import { AuthService } from '../data/application/auth-service';
import { VerifyStatus } from '../data/models/auth-models';

// ─── Verify Feature Handler ───────────────────────────────────────
// Liest den Magic-Link-Token aus der Route und stösst die
// Verifizierung automatisch an. UI zeigt nur den Status.
//
// Selector-Konvention: feature-*

@Component({
  selector: 'feature-verify-handler',
  standalone: true,
  imports: [VerifyComponent],
  template: ` <ui-verify [status]="status()" [error]="auth.error()" (onRetry)="retry()" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyHandlerComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  // ── Feature-lokaler State ───────────────────────────────────
  private readonly localStatus = signal<VerifyStatus>('verifying');
  private token = '';

  // ── Derived Signals ──────────────────────────────────────────
  readonly status = computed<VerifyStatus>(() => {
    if (this.auth.error()) return 'error';
    if (this.auth.isAuthenticated()) return 'success';
    return this.localStatus();
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.localStatus.set('error');
      return;
    }

    this.verify();
  }

  // ── Event Handlers ────────────────────────────────────────────

  retry(): void {
    this.auth.clearError();
    this.localStatus.set('verifying');
    this.verify();
  }

  private verify(): void {
    this.auth.verifyToken({ token: this.token });
  }
}
