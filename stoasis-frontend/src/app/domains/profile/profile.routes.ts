import { Routes } from '@angular/router';
export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/profile-page-handler').then((m) => m.ProfilePageHandlerComponent),
  },
];
