import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from './api-url';
import { UserFlag } from '../models/tutorial';

@Injectable({ providedIn: 'root' })
export class UserFlagsApi {
  private readonly http = inject(HttpClient);
  list() {
    return this.http.get<UserFlag[]>(`${API_URL}/me/flags`);
  }
  acknowledge(key: string, outcome: UserFlag['outcome']) {
    return this.http.put<void>(`${API_URL}/me/flags/${encodeURIComponent(key)}`, { outcome });
  }
}
