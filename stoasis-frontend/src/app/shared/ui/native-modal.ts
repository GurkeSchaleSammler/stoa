import { DestroyRef, Directive, ElementRef, afterNextRender, inject, output } from '@angular/core';

/** Gives full-screen overlays native focus trapping, Escape and focus restoration. */
@Directive({
  selector: 'dialog[uiNativeModal]',
  standalone: true,
  host: { '(cancel)': 'cancel($event)' },
})
export class NativeModalDirective {
  readonly dismissed = output<void>();
  private readonly dialog = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  private opener: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      if (this.dialog.isConnected && !this.dialog.open) {
        this.opener = this.dialog.ownerDocument.activeElement as HTMLElement | null;
        this.dialog.showModal();
      }
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.dialog.open) this.dialog.close();
      // Conditional Angular views can detach the dialog before native close restores focus.
      window.requestAnimationFrame(() => {
        if (this.opener?.isConnected && !document.querySelector('dialog:modal'))
          this.opener.focus();
      });
    });
  }

  protected cancel(event: Event): void {
    event.preventDefault();
    this.dismissed.emit();
  }
}
