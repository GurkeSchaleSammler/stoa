import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../../shared/ui/app-icon';
import { VerifyStatus } from '../../data/models/verify-status';

@Component({
  selector: 'ui-verify',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent],
  templateUrl: './verify.html',
  styleUrl: './verify.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyComponent {
  readonly status = input.required<VerifyStatus>();
  readonly error = input<string | null>(null);

  readonly onRetry = output<void>();

  retry(): void {
    this.onRetry.emit();
  }
}
