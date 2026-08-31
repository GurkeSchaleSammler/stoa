import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../../../../shared/api/api-url';
import { AuthResponse } from '../models/auth-response';
import { LoginRequest } from '../models/login-request';
import { RegisterRequest } from '../models/register-request';
import { MagicLinkRequest } from '../models/magic-link-request';
import { MagicLinkResponse } from '../models/magic-link-response';
import { VerifyTokenRequest } from '../models/verify-token-request';
import { User } from '../../../../shared/models/user';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/auth`;

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body);
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, body);
  }

  requestMagicLink(body: MagicLinkRequest): Observable<MagicLinkResponse> {
    return this.http.post<MagicLinkResponse>(`${this.base}/magic-link`, body);
  }

  verifyToken(body: VerifyTokenRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/verify`, body);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {});
  }
}
