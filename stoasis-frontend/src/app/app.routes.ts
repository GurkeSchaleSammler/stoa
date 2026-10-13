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
    path: 'groups/join/:token',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./domains/group/group-join-page').then((m) => m.GroupJoinPageComponent),
  },
  {
    path: 'profile-boards/:id',
    loadComponent: () =>
      import('./domains/skill/public-profile-board-page').then(
        (m) => m.PublicProfileBoardPageComponent,
      ),
  },
  {
    path: 'shared/collections/:id',
    loadComponent: () =>
      import('./domains/collection/public-board-page').then((m) => m.PublicBoardPageComponent),
  },
  {
    path: 'shared/worlds/:id',
    loadComponent: () =>
      import('./domains/world/public-world-page').then((m) => m.PublicWorldPageComponent),
  },
  {
    path: 'stoaql-docs',
    loadChildren: () =>
      import('./domains/stoaql-docs/stoaql-docs.routes').then((m) => m.STOAQL_DOCS_ROUTES),
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
        path: 'worlds',
        loadChildren: () => import('./domains/world/world.routes').then((m) => m.WORLD_ROUTES),
      },
      {
        path: 'skills',
        loadComponent: () =>
          import('./domains/skill/profile-skills-page').then((m) => m.ProfileSkillsPageComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./domains/group/group-list-page').then((m) => m.GroupListPageComponent),
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./domains/group/group-detail-page').then((m) => m.GroupDetailPageComponent),
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
