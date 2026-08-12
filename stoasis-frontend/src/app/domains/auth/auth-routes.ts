import { Routes } from '@angular/router';
import { guestGuard } from './data/application/auth-guard';

// ─── Auth Routes ──────────────────────────────────────────────────
// Lazy-loaded als eigenes Chunk. GuestGuard verhindert,
// dass eingeloggte User Login/Register sehen.
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./feature/login-handler').then((m) => m.LoginHandlerComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./feature/register-handler').then((m) => m.RegisterHandlerComponent),
  },
  {
    path: 'verify',
    loadComponent: () => import('./feature/verify-handler').then((m) => m.VerifyHandlerComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
