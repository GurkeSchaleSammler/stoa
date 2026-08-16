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

// ─── Auth API Repository ──────────────────────────────────────────
// Reine HTTP-Schicht. Kein State, keine Seiteneffekte.
// Jede Methode bildet genau einen REST-Endpunkt ab.
// Cookies (httpOnly) werden vom Browser automatisch mitgesendet.

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/auth`;

  // POST /api/auth/login
  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body);
  }

  // POST /api/auth/register
  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, body);
  }

  // POST /api/auth/magic-link
  requestMagicLink(body: MagicLinkRequest): Observable<MagicLinkResponse> {
    return this.http.post<MagicLinkResponse>(`${this.base}/magic-link`, body);
  }

  // POST /api/auth/verify
  verifyToken(body: VerifyTokenRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/verify`, body);
  }

  // GET /api/auth/me  –  Session prüfen (Cookie wird mitgesendet)
  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  // POST /api/auth/logout
  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {});
  }
}
