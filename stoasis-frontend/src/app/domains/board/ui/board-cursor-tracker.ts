import { DestroyRef, Directive, ElementRef, effect, inject, input, output } from '@angular/core';
import { boardCursorPosition, BoardCursorPosition } from '../data/models/board-presence';

@Directive({ selector: '[uiBoardCursorTracker]', standalone: true })
export class BoardCursorTrackerDirective {
  readonly cursorZoom = input(1);
  readonly cursorWidth = input.required<number>();
  readonly cursorHeight = input.required<number>();
  readonly cursorMoved = output<BoardCursorPosition | null>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private pointer: { x: number; y: number } | null = null;

  constructor() {
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      this.pointer = { x: event.clientX, y: event.clientY };
      this.publish();
    };
    const clear = () => {
      this.pointer = null;
      this.cursorMoved.emit(null);
    };
    const scroll = () => this.publish();
    // Capture still observes movement when pin dragging stops event propagation.
    this.element.addEventListener('pointermove', move, { capture: true, passive: true });
    this.element.addEventListener('pointerleave', clear);
    this.element.addEventListener('pointercancel', clear);
    window.addEventListener('blur', clear);
    window.addEventListener('scroll', scroll, { capture: true, passive: true });
    effect(() => {
      this.cursorZoom();
      clear(); // A stationary mouse must not retain the old zoom's board position.
    });
    inject(DestroyRef).onDestroy(() => {
      this.element.removeEventListener('pointermove', move, true);
      this.element.removeEventListener('pointerleave', clear);
      this.element.removeEventListener('pointercancel', clear);
      window.removeEventListener('blur', clear);
      window.removeEventListener('scroll', scroll, true);
      clear();
    });
  }

  private publish(): void {
    if (!this.pointer) return;
    this.cursorMoved.emit(
      boardCursorPosition(
        this.pointer.x,
        this.pointer.y,
        this.element.getBoundingClientRect(),
        this.cursorWidth(),
        this.cursorHeight(),
      ),
    );
  }
}
