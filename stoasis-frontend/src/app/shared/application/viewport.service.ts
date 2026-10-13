import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** One breakpoint for mobile navigation and the initial board presentation. */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 760px)')
      : null;
  private readonly isCompact = signal(this.media?.matches ?? false);
  readonly compact = this.isCompact.asReadonly();

  constructor() {
    const update = (event: MediaQueryListEvent) => this.isCompact.set(event.matches);
    this.media?.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', update));
  }
}
