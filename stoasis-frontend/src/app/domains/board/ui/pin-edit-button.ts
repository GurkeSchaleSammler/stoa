import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';

@Component({
  selector: 'ui-pin-edit-button',
  standalone: true,
  imports: [AppIconComponent, TranslatePipe],
  template: `
    <button
      type="button"
      class="pin-edit-handle"
      [attr.aria-label]="'common.edit' | translate"
      (pointerdown)="$event.stopPropagation()"
      (click)="$event.stopPropagation(); edit.emit()"
    >
      <ui-app-icon name="edit" />
    </button>
  `,
  styles: `
    .pin-edit-handle {
      position: absolute;
      z-index: 6;
      top: 8px;
      right: 44px;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
      border-radius: 9px;
      background: color-mix(in srgb, var(--surface-raised) 92%, transparent);
      color: var(--muted);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      opacity: 0.78;
      transition:
        opacity 0.18s var(--ease-soft),
        color 0.18s var(--ease-soft),
        transform 0.18s var(--ease-soft);
    }
    .pin-edit-handle:hover,
    .pin-edit-handle:focus-visible {
      color: var(--accent-strong);
      opacity: 1;
      transform: translateY(-1px);
    }
  `,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinEditButtonComponent {
  readonly edit = output<void>();
}
