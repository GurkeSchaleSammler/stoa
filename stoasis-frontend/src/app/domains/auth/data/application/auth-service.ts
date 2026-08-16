import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, EMPTY, finalize, map, Observable, of, tap } from 'rxjs';

import { AuthApi } from '../api/auth.api';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { AuthState } from '../models/auth-state';
import { initialAuthState } from '../models/initial-auth-state';
import { User } from '../../../../shared/models/user';
import { AuthStatus } from '../models/auth-status';
import { LoginRequest } from '../models/login-request';
import { RegisterRequest } from '../models/register-request';
import { MagicLinkRequest } from '../models/magic-link-request';
import { VerifyTokenRequest } from '../models/verify-token-request';

// ─── Auth Application Service ─────────────────────────────────────
// Orchestriert Auth-Flows. Hält den globalen Auth-State als Signals.
// Wird vom Feature konsumiert, nie direkt von UI-Components.

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly session = inject(SessionContextStore);
  private readonly snackbars = inject(SnackbarService);
  private sessionChecked = false;

  // ── State (privat beschreibbar, öffentlich readonly) ──────────
  private readonly state = signal<AuthState>(initialAuthState);

  // ── Öffentliche Signals (readonly, für Features/Guards) ───────
  readonly user = computed<User | null>(() => this.state().user);
  readonly status = computed<AuthStatus>(() => this.state().status);
  readonly error = computed<string | null>(() => this.state().error);
  readonly isAuthenticated = computed(
    () => this.state().status === 'authenticated' && this.session.isAuthenticated(),
  );
  readonly isLoading = computed(() => this.state().status === 'loading');

  // ── Commands ──────────────────────────────────────────────────

  login(request: LoginRequest): void {
    this.setLoading();
    this.api
      .login(request)
      .pipe(
        tap((res) => this.setAuthenticated(res.user)),
        tap(() => this.snackbars.success('snackbar.loggedIn')),
        tap(() => this.router.navigateByUrl(this.redirectAfterAuthentication())),
        catchError((err) => this.handleError(err)),
        finalize(() => this.clearLoadingIfStillLoading()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  register(request: RegisterRequest): void {
    this.setLoading();
    this.api
      .register(request)
      .pipe(
        tap((res) => this.setAuthenticated(res.user)),
        tap(() => this.snackbars.success('snackbar.registered')),
        tap(() => this.router.navigateByUrl(this.redirectAfterAuthentication())),
        catchError((err) => this.handleError(err)),
        finalize(() => this.clearLoadingIfStillLoading()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  requestMagicLink(request: MagicLinkRequest, onSuccess?: () => void): void {
    this.setLoading();
    this.api
      .requestMagicLink(request)
      .pipe(
        tap(() =>
          this.state.update((s) => ({
            ...s,
            status: 'idle',
            error: null,
          })),
        ),
        tap(() => this.snackbars.success('snackbar.magicLinkSent')),
        tap(() => onSuccess?.()),
        catchError((err) => this.handleError(err)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  verifyToken(request: VerifyTokenRequest): void {
    this.setLoading();
    this.api
      .verifyToken(request)
      .pipe(
        tap((res) => this.setAuthenticated(res.user)),
        tap(() => this.snackbars.success('snackbar.loggedIn')),
        tap(() => this.router.navigateByUrl('/')),
        catchError((err) => this.handleError(err)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** Beim App-Start aufrufen – prüft ob eine gültige Session existiert */
  checkSession(): void {
    this.ensureSession().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  ensureSession(): Observable<boolean> {
    if (this.sessionChecked) {
      return of(this.isAuthenticated());
    }

    this.setLoading();
    return this.api.me().pipe(
      tap((user) => this.setAuthenticated(user)),
      map(() => true),
      catchError(() => {
        this.state.set(initialAuthState);
        this.session.setUser(null);
        return of(false);
      }),
      finalize(() => {
        this.sessionChecked = true;
        this.clearLoadingIfStillLoading();
      }),
    );
  }

  logout(): void {
    this.api
      .logout()
      .pipe(
        tap(() => {
          this.state.set(initialAuthState);
          this.session.setUser(null);
          this.snackbars.success('snackbar.loggedOut');
          this.router.navigateByUrl('/auth/login');
        }),
        catchError(() => {
          // Auch bei Fehler lokal ausloggen
          this.snackbars.error('errors.logout');
          this.state.set(initialAuthState);
          this.session.setUser(null);
          this.router.navigateByUrl('/auth/login');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }

  // ── Private Helpers ───────────────────────────────────────────

  private setLoading(): void {
    this.state.update((s) => ({ ...s, status: 'loading', error: null }));
  }

  private setAuthenticated(user: User): void {
    this.sessionChecked = true;
    this.session.setUser(user);
    this.state.set({ user, status: 'authenticated', error: null });
  }

  private clearLoadingIfStillLoading(): void {
    if (this.status() === 'loading') {
      this.state.update((s) => ({ ...s, status: 'idle' }));
    }
  }

  private redirectAfterAuthentication(): string {
    const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
    return typeof returnUrl === 'string' && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/';
  }

  private handleError(err: unknown) {
    const message =
      (err as { error?: { message?: string } })?.error?.message ?? 'errors.unexpected';

    this.state.update((s) => ({ ...s, status: 'error', error: message }));
    this.snackbars.error(message);
    return EMPTY;
  }
}
