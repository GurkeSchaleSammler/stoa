import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogComponent } from './dialog';
import { TranslatePipe } from '@ngx-translate/core';

/** Reusable, interactive help bubble; the anchor may be absent on smaller screens. */
@Component({
  selector: 'ui-popover',
  standalone: true,
  imports: [DialogComponent, TranslatePipe],
  template: `
    <ui-dialog
      [open]="open()"
      [title]="title()"
      [anchor]="anchor()"
      [busy]="busy()"
      (closed)="closed.emit()"
    >
      <p>{{ text() | translate }}</p>
      <ng-content />
    </ui-dialog>
  `,
  styles: `
    p {
      color: var(--muted);
      line-height: 1.6;
      margin: 0 0 20px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly anchor = input<HTMLElement | null>(null);
  readonly busy = input(false);
  readonly closed = output<void>();
}
