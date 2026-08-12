import { Routes } from '@angular/router';

export const MEMBERSHIP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/member-list-handler').then((m) => m.MemberListHandlerComponent),
  },
];

export const JOIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/join-page-handler').then((m) => m.JoinPageHandlerComponent),
  },
];
