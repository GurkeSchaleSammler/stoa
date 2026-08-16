import { Injectable, signal } from '@angular/core';
import { InterpolationParameters } from '@ngx-translate/core';

export type SnackbarTone = 'success' | 'error' | 'info';

export interface SnackbarMessage {
  id: number;
  message: string;
  params?: InterpolationParameters;
  tone: SnackbarTone;
  actionLabel?: string;
  action?: () => void;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private nextId = 0;
  private readonly messageState = signal<SnackbarMessage[]>([]);
  readonly messages = this.messageState.asReadonly();

  success(message: string, params?: InterpolationParameters): void {
    this.show(message, 'success', params);
  }

  error(message: string, params?: InterpolationParameters): void {
    this.show(message, 'error', params, 6000);
  }

  info(message: string, params?: InterpolationParameters): void {
    this.show(message, 'info', params);
  }

  withAction(
    message: string,
    actionLabel: string,
    action: () => void,
    params?: InterpolationParameters,
  ): void {
    this.show(message, 'info', params, 6500, actionLabel, action);
  }

  runAction(message: SnackbarMessage): void {
    message.action?.();
    this.dismiss(message.id);
  }

  dismiss(id: number): void {
    this.messageState.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(
    message: string,
    tone: SnackbarTone,
    params?: InterpolationParameters,
    duration = 4200,
    actionLabel?: string,
    action?: () => void,
  ): void {
    const id = ++this.nextId;
    this.messageState.update((messages) => [
      ...messages.slice(-2),
      { id, message, params, tone, actionLabel, action },
    ]);
    window.setTimeout(() => this.dismiss(id), duration);
  }
}
