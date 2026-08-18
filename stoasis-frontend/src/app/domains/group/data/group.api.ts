import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../shared/api/api-url';
import { GroupDetail, GroupSkillMember, GroupSummary, SharingPreference } from './group.models';

@Injectable({ providedIn: 'root' })
export class GroupApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/groups`;

  list(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>(this.base);
  }

  create(name: string): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(this.base, { name });
  }

  detail(id: string): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.base}/${id}`);
  }

  skills(id: string): Observable<GroupSkillMember[]> {
    return this.http.get<GroupSkillMember[]>(`${this.base}/${id}/skills`);
  }

  updateSharing(id: string, sharingPreference: SharingPreference): Observable<GroupDetail> {
    return this.http.patch<GroupDetail>(`${this.base}/${id}/sharing`, { sharingPreference });
  }

  join(token: string): Observable<{ groupId: string }> {
    return this.http.post<{ groupId: string }>(`${this.base}/join/${token}`, {});
  }

  leave(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/membership`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
