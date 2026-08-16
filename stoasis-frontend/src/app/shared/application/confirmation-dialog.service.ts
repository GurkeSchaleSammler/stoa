import { Injectable, signal } from '@angular/core';
import { ConfirmationDialogRequest } from '../models/confirmation-dialog-request';

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  private readonly requestState = signal<ConfirmationDialogRequest | null>(null);
  private resolver: ((confirmed: boolean) => void) | null = null;
  readonly request = this.requestState.asReadonly();

  confirm(
    request: Pick<ConfirmationDialogRequest, 'title' | 'message'> &
      Partial<Pick<ConfirmationDialogRequest, 'confirmLabel' | 'cancelLabel' | 'tone'>>,
  ): Promise<boolean> {
    this.resolve(false);
    this.requestState.set({
      title: request.title,
      message: request.message,
      confirmLabel: request.confirmLabel ?? 'common.confirm',
      cancelLabel: request.cancelLabel ?? 'common.cancel',
      tone: request.tone ?? 'default',
    });
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  accept(): void {
    this.resolve(true);
  }

  cancel(): void {
    this.resolve(false);
  }

  private resolve(confirmed: boolean): void {
    this.resolver?.(confirmed);
    this.resolver = null;
    this.requestState.set(null);
  }
}
