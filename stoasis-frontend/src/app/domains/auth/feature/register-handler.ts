import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { email, form, minLength, required } from '@angular/forms/signals';
import { RegisterComponent } from '../ui/register/register';
import { AuthService } from '../data/application/auth-service';
import { RegisterFieldErrors } from '../data/models/register-field-errors';
import { noRegisterFieldErrors } from '../data/models/no-register-field-errors';
import { RegisterFormValue } from '../data/models/register-form-value';

@Component({
  selector: 'feature-register-handler',
  standalone: true,
  imports: [RegisterComponent],
  template: `
    <ui-register
      [isLoading]="auth.isLoading()"
      [error]="auth.error()"
      [fieldErrors]="fieldErrors()"
      [canSubmit]="canSubmit()"
      (onSubmit)="handleSubmit($event)"
      (onFieldChange)="validateField($event.field, $event.value, $event.form)"
      (onClearError)="auth.clearError()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterHandlerComponent {
  protected readonly auth = inject(AuthService);

  readonly fieldErrors = signal<RegisterFieldErrors>(noRegisterFieldErrors);
  private readonly model = signal<RegisterFormValue>({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  readonly registerForm = form(this.model, (path) => {
    required(path.name);
    minLength(path.name, 2);
    required(path.email);
    email(path.email);
    required(path.password);
    minLength(path.password, 8);
    required(path.passwordConfirm);
  });

  readonly canSubmit = computed(() => {
    const value = this.model();
    return this.registerForm().valid() && value.passwordConfirm === value.password;
  });

  handleSubmit(form: RegisterFormValue): void {
    this.model.set(form);
    const errors = this.validateAll(form);
    this.fieldErrors.set(errors);

    const hasErrors = Object.values(errors).some((e) => e !== null);
    if (hasErrors) return;

    this.auth.register({
      name: form.name,
      email: form.email,
      password: form.password,
    });
  }

  validateField(field: keyof RegisterFieldErrors, _value: string, form: RegisterFormValue): void {
    this.model.set(form);
    const errors = this.validateAll(form);
    this.fieldErrors.update((prev) => ({ ...prev, [field]: errors[field] }));
  }

  private validateAll(form: RegisterFormValue): RegisterFieldErrors {
    return {
      name: form.name.trim().length < 2 ? 'validation.minLength2' : null,
      email: this.isValidEmail(form.email) ? null : 'validation.invalidEmail',
      password: form.password.length < 8 ? 'validation.minLength8' : null,
      passwordConfirm:
        form.passwordConfirm !== form.password ? 'validation.passwordMismatch' : null,
    };
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
