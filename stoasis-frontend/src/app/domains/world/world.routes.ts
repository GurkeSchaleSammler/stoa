import { Routes } from '@angular/router';

export const WORLD_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./worlds-page').then((m) => m.WorldsPageComponent) },
];
