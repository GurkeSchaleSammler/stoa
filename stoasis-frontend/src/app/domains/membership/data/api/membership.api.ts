import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import { Role } from '../../../../shared/models/role';
import { Member } from '../models/member';
import { InviteInfo } from '../models/invite-info';

@Injectable({ providedIn: 'root' })
export class MembershipApi {
  private readonly http = inject(HttpClient);

  list(collectionId: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${API_URL}/collections/${collectionId}/members`);
  }

  updateRole(collectionId: string, userId: string, role: Role): Observable<Member> {
    return this.http.patch<Member>(`${API_URL}/collections/${collectionId}/members/${userId}`, {
      role,
    });
  }

  remove(collectionId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/collections/${collectionId}/members/${userId}`);
  }

  invite(collectionId: string): Observable<InviteInfo> {
    return this.http.get<InviteInfo>(`${API_URL}/collections/${collectionId}/invite`);
  }

  setVisibility(collectionId: string, visibility: 'private' | 'link'): Observable<InviteInfo> {
    return this.http.patch<InviteInfo>(`${API_URL}/collections/${collectionId}/invite`, {
      visibility,
    });
  }

  invitePreview(token: string): Observable<InviteInfo> {
    return this.http.get<InviteInfo>(`${API_URL}/invites/${token}`);
  }

  join(token: string): Observable<{ collectionId: string }> {
    return this.http.post<{ collectionId: string }>(`${API_URL}/collections/join/${token}`, {});
  }
}
