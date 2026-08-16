import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../../shared/ui/app-icon';
import { VerifyStatus } from '../../data/models/verify-status';

// ─── Verify UI Component ──────────────────────────────────────────
// KEINE Logik. Zeigt nur den vom Feature berechneten Status an.
//
// Selector-Konvention: ui-*

@Component({
  selector: 'ui-verify',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent],
  templateUrl: './verify.html',
  styleUrl: './verify.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyComponent {
  // ── Inputs (Signals vom Feature) ────────────────────────────
  readonly status = input.required<VerifyStatus>();
  readonly error = input<string | null>(null);

  // ── Outputs (Events an Feature) ─────────────────────────────
  readonly onRetry = output<void>();

  // ── Template-Methoden (nur Delegation) ──────────────────────

  retry(): void {
    this.onRetry.emit();
  }
}
