import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, tap } from 'rxjs';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { BoardApi } from '../api/board.api';
import { BoardColorVariant } from '../models/board-color-variant';
import { BoardElementsStore } from './board-elements.store';

@Injectable({ providedIn: 'root' })
export class ConnectorActionsService {
  private readonly api = inject(BoardApi);
  private readonly store = inject(BoardElementsStore);
  private readonly snackbars = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  create(
    collectionId: string,
    sourcePinId: string,
    targetPinId: string,
    color: BoardColorVariant = 'accent',
  ): void {
    this.api
      .createConnector(collectionId, sourcePinId, targetPinId, color)
      .pipe(
        tap((connector) =>
          this.store.update((elements) => ({
            ...elements,
            connectors: [...elements.connectors, connector],
          })),
        ),
        tap(() => this.snackbars.success('snackbar.connectorCreated')),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  update(collectionId: string, connectorId: string, color: BoardColorVariant): void {
    this.api
      .updateConnector(collectionId, connectorId, color)
      .pipe(
        tap((updated) =>
          this.store.update((elements) => ({
            ...elements,
            connectors: elements.connectors.map((connector) =>
              connector.id === updated.id ? updated : connector,
            ),
          })),
        ),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  delete(collectionId: string, connectorId: string): void {
    this.api
      .deleteConnector(collectionId, connectorId)
      .pipe(
        tap(() =>
          this.store.update((elements) => ({
            ...elements,
            connectors: elements.connectors.filter((connector) => connector.id !== connectorId),
          })),
        ),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
