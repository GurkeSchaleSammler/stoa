import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../../shared/ui/app-icon';
import { LoginMode } from '../../data/models/login-mode';
import { LoginFormValue } from '../../data/models/login-form-value';

@Component({
  selector: 'ui-login',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AppIconComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly mode = input.required<LoginMode>();
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly magicLinkSent = input(false);
  readonly passwordVisible = input(false);
  readonly submitLabel = input('');
  readonly notice = input<string | null>(null);

  readonly onSubmit = output<LoginFormValue>();
  readonly onModeSwitch = output<LoginMode>();
  readonly onTogglePassword = output<void>();
  readonly onClearError = output<void>();

  email = '';
  password = '';

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
