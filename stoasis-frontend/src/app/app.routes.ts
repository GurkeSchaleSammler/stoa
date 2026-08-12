import { Routes } from '@angular/router';
import { authGuard } from './domains/auth/data/application/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./domains/auth/auth-routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'join/:token',
    canActivate: [authGuard],
    loadChildren: () => import('./domains/membership/membership.routes').then((m) => m.JOIN_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/workspace-shell').then((m) => m.WorkspaceShellComponent),
    children: [
      { path: '', loadComponent: () => import('./shell/home').then((m) => m.HomeComponent) },
      {
        path: 'collections',
        loadChildren: () =>
          import('./domains/collection/collection.routes').then((m) => m.COLLECTION_ROUTES),
      },
      {
        path: 'collections/:id/members',
        loadChildren: () =>
          import('./domains/membership/membership.routes').then((m) => m.MEMBERSHIP_ROUTES),
      },
      {
        path: 'collections/:id',
        loadChildren: () => import('./domains/board/board.routes').then((m) => m.BOARD_ROUTES),
      },
      {
        path: 'search',
        loadChildren: () => import('./domains/search/search.routes').then((m) => m.SEARCH_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./domains/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
