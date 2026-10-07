import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BoardCursorPosition, BoardParticipant } from '../models/board-presence';

@Injectable({ providedIn: 'root' })
export class BoardPresenceApi {
  private readonly http = inject(HttpClient);

  exchange(boardId: string, clientId: string, cursor: BoardCursorPosition | null) {
    return this.http.post<BoardParticipant[]>(this.url(boardId, clientId), { cursor });
  }

  leave(boardId: string, clientId: string) {
    return this.http.delete<void>(this.url(boardId, clientId));
  }

  private url(boardId: string, clientId: string): string {
    return `/api/collections/${encodeURIComponent(boardId)}/presence/${clientId}`;
  }
}
