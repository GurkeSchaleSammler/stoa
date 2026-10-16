import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../../../shared/api/api-url';
import {
  BoardExperience,
  DateDraft,
  PathDraft,
  PresentationPath,
} from '../models/board-experience';

@Injectable({ providedIn: 'root' })
export class BoardExperienceApi {
  private readonly http = inject(HttpClient);
  private url(id: string) {
    return `${API_URL}/collections/${id}/experience`;
  }
  load(id: string) {
    return this.http.get<BoardExperience>(this.url(id));
  }
  savePath(id: string, draft: PathDraft) {
    return draft.id
      ? this.http.put<PresentationPath>(`${this.url(id)}/paths/${draft.id}`, draft)
      : this.http.post<PresentationPath>(`${this.url(id)}/paths`, draft);
  }
  deletePath(id: string, pathId: string) {
    return this.http.delete<void>(`${this.url(id)}/paths/${pathId}`);
  }
  saveDate(id: string, draft: DateDraft) {
    return this.http.put<void>(`${this.url(id)}/dates/${draft.pinId}`, draft);
  }
}
