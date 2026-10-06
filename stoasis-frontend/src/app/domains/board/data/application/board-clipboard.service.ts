import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { Pin } from '../../../../shared/models/pin';
import { TranslateService } from '@ngx-translate/core';

export interface CopiedPin {
  sourceCollectionId: string;
  pinId: string;
  label: string;
}

/** In-app clipboard holds IDs, not private content, and is cleared on account changes. */
@Injectable({ providedIn: 'root' })
export class BoardClipboardService {
  private readonly session = inject(SessionContextStore);
  private readonly feedback = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly copiedState = signal<(CopiedPin & { userId: string }) | null>(null);
  readonly copied = computed(() =>
    this.copiedState()?.userId === this.session.userId() ? this.copiedState() : null,
  );
  constructor() {
    effect(() => {
      const userId = this.session.userId();
      if (this.copiedState()?.userId !== userId) this.copiedState.set(null);
    });
  }
  copy(pin: Pin): void {
    const userId = this.session.userId();
    if (!userId || pin.type === 'skill') return;
    const label =
      pin.type === 'link'
        ? pin.data.title
        : pin.type === 'note'
          ? pin.data.title || pin.data.content
          : pin.data.caption || this.translate.instant('pin.type.photo');
    this.copiedState.set({
      sourceCollectionId: pin.collectionId,
      pinId: pin.id,
      label: label.slice(0, 80),
      userId,
    });
    this.feedback.success('templates.pinCopied');
  }
}
