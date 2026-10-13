import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subscription, timeout } from 'rxjs';
import { BoardPresenceApi } from '../api/board-presence.api';
import {
  BoardCursorPosition,
  BoardParticipant,
  BoardPresenceStatus,
} from '../models/board-presence';

/** One instance per board screen. Exchanges are sequential and discard obsolete route results. */
@Injectable()
export class BoardPresenceStore {
  private readonly api = inject(BoardPresenceApi);
  private readonly participantsState = signal<BoardParticipant[]>([]);
  private readonly statusState = signal<BoardPresenceStatus>('idle');
  readonly participants = this.participantsState.asReadonly();
  readonly status = this.statusState.asReadonly();
  private connection: { boardId: string; clientId: string } | null = null;
  private cursor: BoardCursorPosition | null = null;
  private timer?: ReturnType<typeof setTimeout>;
  private request?: Subscription;
  private retryDelay = 1000;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.disconnect());
  }

  connect(boardId: string): void {
    if (this.connection?.boardId === boardId) return;
    this.disconnect();
    const connection = { boardId, clientId: crypto.randomUUID() };
    this.connection = connection;
    this.statusState.set('connecting');
    this.exchange(connection);
  }

  move(cursor: BoardCursorPosition | null): void {
    this.cursor = cursor;
  }

  disconnect(): void {
    const old = this.connection;
    this.connection = null;
    clearTimeout(this.timer);
    this.request?.unsubscribe();
    this.cursor = null;
    this.participantsState.set([]);
    this.statusState.set('idle');
    this.retryDelay = 1000;
    if (old) {
      // Best effort; the server lease also expires after an abrupt disconnect.
      this.api
        .leave(old.boardId, old.clientId)
        .pipe(timeout(3000))
        .subscribe({ error: () => {} });
    }
  }

  private exchange(connection: { boardId: string; clientId: string }): void {
    this.request = this.api
      .exchange(connection.boardId, connection.clientId, this.cursor)
      .pipe(timeout(5000))
      .subscribe({
        next: (participants) => {
          if (this.connection !== connection) return;
          this.participantsState.set(participants);
          this.statusState.set('connected');
          this.retryDelay = 1000;
          this.timer = setTimeout(
            () => this.exchange(connection),
            participants.length ? 250 : 1000,
          );
        },
        error: (error: unknown) => {
          if (this.connection !== connection) return;
          this.participantsState.set([]);
          this.statusState.set('reconnecting');
          if (error instanceof HttpErrorResponse && [401, 403, 404].includes(error.status)) {
            // Membership/session changes require a fresh board load.
            this.connection = null;
            this.statusState.set('unavailable');
            return;
          }
          this.timer = setTimeout(() => this.exchange(connection), this.retryDelay);
          this.retryDelay = Math.min(this.retryDelay * 2, 5000);
        },
      });
  }
}
