import { Routes } from '@angular/router';

export const COLLECTION_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./feature/collection-create-handler').then((m) => m.CollectionCreateHandlerComponent),
  },
  {
    path: ':id/settings',
    loadComponent: () =>
      import('./feature/collection-settings-handler').then(
        (m) => m.CollectionSettingsHandlerComponent,
      ),
  },
];
