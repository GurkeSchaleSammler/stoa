import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../shared/api/api-url';
import {
  BoardKind,
  ProfileBoard,
  ProfileBoardVisibility,
  SaveProfileSkillRequest,
} from './profile-board.models';

/** Connects skill editing and profile sharing to the API. */
@Injectable({ providedIn: 'root' })
export class ProfileBoardApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/profile-boards`;

  list(): Observable<ProfileBoard[]> {
    return this.http.get<ProfileBoard[]>(this.base);
  }

  createSkill(kind: BoardKind, body: SaveProfileSkillRequest): Observable<ProfileBoard> {
    return this.http.post<ProfileBoard>(`${this.base}/${kind}/skills`, body);
  }

  updateSkill(
    kind: BoardKind,
    pinId: string,
    body: SaveProfileSkillRequest,
  ): Observable<ProfileBoard> {
    return this.http.patch<ProfileBoard>(`${this.base}/${kind}/skills/${pinId}`, body);
  }

  deleteSkill(kind: BoardKind, pinId: string): Observable<ProfileBoard> {
    return this.http.delete<ProfileBoard>(`${this.base}/${kind}/skills/${pinId}`);
  }

  moveSkill(
    kind: BoardKind,
    pinId: string,
    grid: Pick<ProfileBoard['skills'][number]['grid'], 'x' | 'y' | 'heightClips' | 'layer'>,
  ): Observable<ProfileBoard> {
    return this.http.patch<ProfileBoard>(`${this.base}/${kind}/skills/${pinId}/grid`, grid);
  }

  setVisibility(kind: BoardKind, visibility: ProfileBoardVisibility): Observable<ProfileBoard> {
    return this.http.patch<ProfileBoard>(`${this.base}/${kind}/visibility`, { visibility });
  }

  setAccent(kind: BoardKind, accent: string): Observable<ProfileBoard> {
    return this.http.patch<ProfileBoard>(`${this.base}/${kind}/accent`, { accent });
  }

  publicView(id: string, token?: string | null): Observable<ProfileBoard> {
    const params = token ? new HttpParams().set('token', token) : undefined;
    return this.http.get<ProfileBoard>(`${API_URL}/public/profile-boards/${id}`, { params });
  }
}
