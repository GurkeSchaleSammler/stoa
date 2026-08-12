import { Routes } from '@angular/router';

export const BOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/board-canvas-handler').then((m) => m.BoardCanvasHandlerComponent),
  },
];
