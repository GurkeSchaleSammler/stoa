import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth-service';

// ─── Auth Guard ───────────────────────────────────────────────────
// Functional Guard (Angular 20+). Prüft den Auth-Signal-State.
// Unauthentifizierte User werden auf /auth/login umgeleitet.

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth
    .ensureSession()
    .pipe(
      map(
        (authenticated) =>
          authenticated ||
          router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }),
      ),
    );
};

// ─── Guest Guard ──────────────────────────────────────────────────
// Umgekehrte Logik: Verhindert, dass eingeloggte User die
// Login-/Register-Seiten sehen (leitet auf / weiter).

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth
    .ensureSession()
    .pipe(map((authenticated) => !authenticated || router.createUrlTree(['/'])));
};
