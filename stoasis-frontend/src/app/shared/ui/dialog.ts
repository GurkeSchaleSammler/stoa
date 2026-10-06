import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from './app-icon';

/** Native modal semantics provide focus trapping, Escape and focus restoration. */
@Component({
  selector: 'ui-dialog',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <dialog
      #dialog
      [class.anchored]="anchor()"
      [style.left.px]="position()?.left"
      [style.top.px]="position()?.top"
      [attr.aria-label]="title() | translate"
      (cancel)="cancel($event)"
      (click)="backdrop($event)"
    >
      <header>
        <h2>{{ title() | translate }}</h2>
        <button
          type="button"
          [disabled]="busy()"
          (click)="closed.emit()"
          [attr.aria-label]="'common.close' | translate"
        >
          <ui-app-icon name="close" />
        </button>
      </header>
      <ng-content />
    </dialog>
  `,
  styleUrl: './dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly busy = input(false);
  readonly anchor = input<HTMLElement | null>(null);
  readonly closed = output<void>();
  protected readonly position = signal<{ left: number; top: number } | null>(null);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect((onCleanup) => {
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (!this.open()) {
        if (dialog.open) dialog.close();
        return;
      }
      const anchor = this.anchor();
      const reposition = () => {
        if (!dialog.isConnected || !dialog.open) return;
        if (!anchor) {
          this.position.set(null);
          return;
        }
        const rect = anchor.getBoundingClientRect();
        const width = Math.min(360, window.innerWidth - 32);
        const height = dialog.getBoundingClientRect().height;
        this.position.set({
          left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
          top: Math.max(16, Math.min(rect.bottom + 12, window.innerHeight - height - 16)),
        });
      };
      // Projected dialogs can be created while their parent view is still being attached.
      const frame = window.requestAnimationFrame(() => {
        if (!dialog.isConnected || !this.open()) return;
        if (!dialog.open) dialog.showModal();
        anchor?.scrollIntoView({ block: 'center', inline: 'nearest' });
        reposition();
        window.requestAnimationFrame(reposition);
      });
      window.addEventListener('resize', reposition);
      window.addEventListener('scroll', reposition, true);
      onCleanup(() => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition, true);
        if (dialog.open) dialog.close();
      });
    });
  }

  cancel(event: Event): void {
    event.preventDefault();
    if (!this.busy()) this.closed.emit();
  }
  backdrop(event: MouseEvent): void {
    if (event.target !== this.dialog()?.nativeElement || this.busy()) return;
    const rect = this.dialog()!.nativeElement.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      this.closed.emit();
  }
}
