import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../../shared/ui/app-icon';
import { LoginFormValue, LoginMode } from '../../data/models/auth-models';

// ─── Login UI Component ───────────────────────────────────────────
// KEINE Logik. Keine injects. Keine Service-Aufrufe.
// Bekommt alles per input(), feuert alles per output().
// OnPush by default (Angular 20+).
//
// Selector-Konvention: ui-*

@Component({
  selector: 'ui-login',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AppIconComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // ── Inputs (Signals vom Feature) ────────────────────────────
  readonly mode = input.required<LoginMode>();
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly magicLinkSent = input(false);
  readonly passwordVisible = input(false);
  readonly submitLabel = input('');
  readonly notice = input<string | null>(null);

  // ── Outputs (Events an Feature) ─────────────────────────────
  readonly onSubmit = output<LoginFormValue>();
  readonly onModeSwitch = output<LoginMode>();
  readonly onTogglePassword = output<void>();
  readonly onClearError = output<void>();

  // ── Template-lokaler State (nur Form-Binding) ───────────────
  email = '';
  password = '';

  // ── Template-Methoden (nur Delegation, keine Logik) ─────────

  submit(): void {
    this.onSubmit.emit({ email: this.email, password: this.password });
  }

  switchTo(mode: LoginMode): void {
    this.onModeSwitch.emit(mode);
  }

  togglePw(): void {
    this.onTogglePassword.emit();
  }

  dismissError(): void {
    this.onClearError.emit();
  }
}
