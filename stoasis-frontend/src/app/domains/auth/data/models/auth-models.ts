// ─── Auth Domain Models ───────────────────────────────────────────

import { User } from '../../../../shared/models/core.models';
export type { Plan, User } from '../../../../shared/models/core.models';

// ─── Request DTOs ─────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

// ─── Response DTOs ────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  expiresAt: string;
}

export interface MagicLinkResponse {
  message: string;
  expiresInSeconds: number;
}

// ─── Auth State ───────────────────────────────────────────────────

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

// ─── Login Form ───────────────────────────────────────────────────

export type LoginMode = 'credentials' | 'magic-link';

export interface LoginFormValue {
  email: string;
  password: string;
}

// ─── Register Form ────────────────────────────────────────────────

export interface RegisterFormValue {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface RegisterFieldErrors {
  name: string | null;
  email: string | null;
  password: string | null;
  passwordConfirm: string | null;
}

export const noRegisterFieldErrors: RegisterFieldErrors = {
  name: null,
  email: null,
  password: null,
  passwordConfirm: null,
};

// ─── Verify (Magic Link) ──────────────────────────────────────────

export type VerifyStatus = 'verifying' | 'success' | 'error';
