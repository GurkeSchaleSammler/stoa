import { Routes } from '@angular/router';
export const SEARCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/search-results-handler').then((m) => m.SearchResultsHandlerComponent),
  },
];
