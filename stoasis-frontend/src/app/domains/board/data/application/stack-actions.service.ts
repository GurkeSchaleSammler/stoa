import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, tap } from 'rxjs';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { BoardApi } from '../api/board.api';
import { StackBlock } from '../models/stack-block';
import { UpdateGridBlockRequest } from '../models/update-grid-block-request';
import { BoardElementsStore } from './board-elements.store';

@Injectable({ providedIn: 'root' })
export class StackActionsService {
  private readonly api = inject(BoardApi);
  private readonly store = inject(BoardElementsStore);
  private readonly snackbars = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  create(collectionId: string, sourcePinId: string, targetPinId: string): void {
    this.api
      .createStack(collectionId, sourcePinId, targetPinId)
      .pipe(
        tap((stack) => {
          this.store.update((elements) => ({
            ...elements,
            stacks: [...elements.stacks, stack],
          }));
          this.snackbars.withAction('snackbar.stackCreated', 'common.undo', () =>
            this.dissolve(collectionId, stack.id),
          );
        }),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  addChild(collectionId: string, stackId: string, pinId: string): void {
    this.api
      .addStackChild(collectionId, stackId, pinId)
      .pipe(
        tap((stack) => this.store.replaceStack(stack)),
        tap(() => this.snackbars.success('snackbar.stackUpdated')),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  update(
    collectionId: string,
    stackId: string,
    update: Partial<Pick<StackBlock, 'x' | 'y' | 'layer' | 'expanded'>>,
  ): void {
    const previous = this.store.stacks().find((stack) => stack.id === stackId);
    if (!previous) return;
    this.store.replaceStack({ ...previous, ...update });
    this.api
      .updateStack(collectionId, stackId, update)
      .pipe(
        tap((stack) => this.store.replaceStack(stack)),
        catchError((error) => {
          this.store.replaceStack(previous);
          return this.store.handleError(error);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  releaseChild(
    collectionId: string,
    stackId: string,
    pinId: string,
    grid: Pick<UpdateGridBlockRequest, 'x' | 'y' | 'layer'>,
  ): void {
    this.api
      .releaseStackChild(collectionId, stackId, { pinId, ...grid })
      .pipe(
        tap((elements) => this.store.set(elements)),
        tap(() => this.snackbars.info('snackbar.pinReleased')),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  dissolve(collectionId: string, stackId: string): void {
    this.api
      .dissolveStack(collectionId, stackId)
      .pipe(
        tap((elements) => this.store.set(elements)),
        tap(() => this.snackbars.info('snackbar.stackDissolved')),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
