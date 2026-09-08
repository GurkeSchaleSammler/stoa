import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import { UpdateProfileRequest } from '../models/update-profile-request';
import { AvatarUpload } from '../models/avatar-upload';
import { ExportFormat } from '../models/export-format';
import { ImportResult } from '../models/import-result';
import { User } from '../../../../shared/models/user';

/** Connects profile settings and data portability to the API. */
@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);
  update(body: UpdateProfileRequest): Observable<User> {
    return this.http.patch<User>(`${API_URL}/profile`, body);
  }
  uploadAvatar(file: File): Observable<AvatarUpload> {
    return this.http.post<AvatarUpload>(`${API_URL}/uploads`, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': file.name,
      },
    });
  }
  delete(): Observable<void> {
    return this.http.delete<void>(`${API_URL}/profile`);
  }
  export(format: ExportFormat, scope: 'boards' | 'account' = 'boards'): Observable<Blob> {
    return this.http.get(`${API_URL}/profile/export`, {
      params: new HttpParams().set('format', format).set('scope', scope),
      responseType: 'blob',
    });
  }
  importPocket(file: File, collectionId: string, preview = false): Observable<ImportResult> {
    return this.http.post<ImportResult>(
      `${API_URL}/profile/import/pocket${preview ? '/preview' : ''}`,
      file,
      {
        params: new HttpParams().set('collectionId', collectionId),
        headers: { 'Content-Type': 'text/csv', 'X-File-Name': file.name },
      },
    );
  }
  billingPortal(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${API_URL}/billing/portal-url`);
  }
  logout(): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/logout`, {});
  }
}
