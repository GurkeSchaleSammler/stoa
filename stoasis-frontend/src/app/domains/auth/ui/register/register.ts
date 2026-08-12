import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RegisterFieldErrors, RegisterFormValue } from '../../data/models/auth-models';

// ─── Register UI Component ────────────────────────────────────────
// KEINE Logik. Keine injects. Keine Validierung.
// Bekommt Fehler bereits fertig berechnet vom Feature.
//
// Selector-Konvention: ui-*

@Component({
  selector: 'ui-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  // ── Inputs (Signals vom Feature) ────────────────────────────
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly fieldErrors = input.required<RegisterFieldErrors>();
  readonly canSubmit = input(true);

  // ── Outputs (Events an Feature) ─────────────────────────────
  readonly onSubmit = output<RegisterFormValue>();
  readonly onFieldChange = output<{
    field: keyof RegisterFieldErrors;
    value: string;
    form: RegisterFormValue;
  }>();
  readonly onClearError = output<void>();

  // ── Template-lokaler State (nur Form-Binding) ───────────────
  name = '';
  email = '';
  password = '';
  passwordConfirm = '';

  // ── Template-Methoden (nur Delegation, keine Logik) ─────────

  submit(): void {
    this.onSubmit.emit(this.currentForm());
  }

  fieldChanged(field: keyof RegisterFieldErrors): void {
    this.onFieldChange.emit({
      field,
      value: this.currentForm()[field === 'passwordConfirm' ? 'passwordConfirm' : field],
      form: this.currentForm(),
    });
  }

  dismissError(): void {
    this.onClearError.emit();
  }

  private currentForm(): RegisterFormValue {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      passwordConfirm: this.passwordConfirm,
    };
  }
}
