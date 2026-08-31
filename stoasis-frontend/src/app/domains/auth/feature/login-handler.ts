import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LoginComponent } from '../ui/login/login';
import { AuthService } from '../data/application/auth-service';
import { ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../../shared/application/translation-service';
import { LoginFormValue } from '../data/models/login-form-value';
import { LoginMode } from '../data/models/login-mode';

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

  readonly mode = signal<LoginMode>('credentials');
  readonly magicLinkSent = signal(false);
  readonly passwordVisible = signal(false);

  readonly submitLabel = computed(() => {
    if (this.auth.isLoading()) return this.i18n.translate('common.loading');
    return this.mode() === 'credentials'
      ? this.i18n.translate('auth.login')
      : this.i18n.translate('auth.sendMagicLink');
  });

  handleSubmit(form: LoginFormValue): void {
    if (this.mode() === 'credentials') {
      this.auth.login({ email: form.email, password: form.password });
    } else {
      this.auth.requestMagicLink({ email: form.email }, () => this.magicLinkSent.set(true));
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
