import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RegisterFieldErrors } from '../../data/models/register-field-errors';
import { RegisterFormValue } from '../../data/models/register-form-value';

@Component({
  selector: 'ui-register',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly fieldErrors = input.required<RegisterFieldErrors>();
  readonly canSubmit = input(true);

  readonly onSubmit = output<RegisterFormValue>();
  readonly onFieldChange = output<{
    field: keyof RegisterFieldErrors;
    value: string;
    form: RegisterFormValue;
  }>();
  readonly onClearError = output<void>();

  name = '';
  email = '';
  password = '';
  passwordConfirm = '';

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
