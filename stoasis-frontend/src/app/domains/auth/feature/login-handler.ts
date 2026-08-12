import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LoginComponent } from '../ui/login/login';
import { AuthService } from '../data/application/auth-service';
import { LoginFormValue, LoginMode } from '../data/models/auth-models';
import { ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../../shared/application/translation-service';

// ─── Login Feature Handler ────────────────────────────────────────
// Enthält ALLE Logik. UI-Component bekommt nur Signals als Input
// und feuert Events nach oben. Kein einziger inject() in der UI.
//
// Selector-Konvention: feature-*

@Component({
  selector: 'feature-login-handler',
  standalone: true,
  imports: [LoginComponent],
  template: `
    <ui-login
      [mode]="mode()"
      [isLoading]="auth.isLoading()"
      [error]="auth.error()"
      [magicLinkSent]="magicLinkSent()"
      [passwordVisible]="passwordVisible()"
      [submitLabel]="submitLabel()"
      [notice]="notice()"
      (onSubmit)="handleSubmit($event)"
      (onModeSwitch)="switchMode($event)"
      (onTogglePassword)="togglePassword()"
      (onClearError)="auth.clearError()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginHandlerComponent {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(TranslationService);
  readonly notice = computed(() =>
    this.route.snapshot.queryParamMap.get('accountDeleted')
      ? this.i18n.translate('auth.accountDeletedNotice')
      : null,
  );

  // ── Feature-lokaler State ───────────────────────────────────
  readonly mode = signal<LoginMode>('credentials');
  readonly magicLinkSent = signal(false);
  readonly passwordVisible = signal(false);

  // ── Derived Signals (computed) ──────────────────────────────
  readonly submitLabel = computed(() => {
    if (this.auth.isLoading()) return this.i18n.translate('common.loading');
    return this.mode() === 'credentials'
      ? this.i18n.translate('auth.login')
      : this.i18n.translate('auth.sendMagicLink');
  });

  // ── Event Handlers (von UI nach oben gefeuert) ──────────────
  handleSubmit(form: LoginFormValue): void {
    if (this.mode() === 'credentials') {
      this.auth.login({ email: form.email, password: form.password });
    } else {
      this.magicLinkSent.set(true);
      this.auth.requestMagicLink({ email: form.email });
    }
  }

  switchMode(mode: LoginMode): void {
    this.mode.set(mode);
    this.magicLinkSent.set(false);
    this.auth.clearError();
  }

  togglePassword(): void {
    this.passwordVisible.update((v) => !v);
  }
}
