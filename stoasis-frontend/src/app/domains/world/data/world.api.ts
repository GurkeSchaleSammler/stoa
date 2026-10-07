import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../shared/api/api-url';
import {
  CreateWorldRequest,
  UpdateWorldRequest,
  WorldBoardContent,
  WorldDetail,
  WorldSummary,
} from './world.models';

@Injectable({ providedIn: 'root' })
export class WorldApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/worlds`;

  list(): Observable<WorldSummary[]> {
    return this.http.get<WorldSummary[]>(this.base);
  }

  detail(id: string): Observable<WorldDetail> {
    return this.http.get<WorldDetail>(`${this.base}/${id}`);
  }

  forBoard(collectionId: string): Observable<WorldDetail[]> {
    return this.http.get<WorldDetail[]>(`${this.base}/for-board/${collectionId}`);
  }

  create(request: CreateWorldRequest): Observable<WorldDetail> {
    return this.http.post<WorldDetail>(this.base, request);
  }

  update(id: string, request: UpdateWorldRequest): Observable<WorldDetail> {
    return this.http.patch<WorldDetail>(`${this.base}/${id}`, request);
  }

  addBoard(id: string, collectionId: string): Observable<WorldDetail> {
    return this.http.post<WorldDetail>(`${this.base}/${id}/boards`, { collectionId });
  }

  removeBoard(id: string, collectionId: string): Observable<WorldDetail> {
    return this.http.delete<WorldDetail>(`${this.base}/${id}/boards/${collectionId}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PublicWorldApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/public/worlds`;

  detail(id: string, token?: string): Observable<WorldDetail> {
    return this.http.get<WorldDetail>(`${this.base}/${id}`, { params: this.params(token) });
  }

  board(id: string, collectionId: string, token?: string): Observable<WorldBoardContent> {
    return this.http.get<WorldBoardContent>(`${this.base}/${id}/boards/${collectionId}`, {
      params: this.params(token),
    });
  }

  private params(token?: string): HttpParams {
    return token ? new HttpParams().set('token', token) : new HttpParams();
  }
}
