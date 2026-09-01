import { Routes } from '@angular/router';

export const STOAQL_DOCS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./stoaql-docs-page').then((m) => m.StoaQlDocsPageComponent),
  },
];
