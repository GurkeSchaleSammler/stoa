import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, Observable, tap } from 'rxjs';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { BoardApi } from '../api/board.api';
import { CreateFloatingLabelRequest } from '../models/create-floating-label-request';
import { CreateSoftZoneRequest } from '../models/create-soft-zone-request';
import { CreateStickerRequest } from '../models/create-sticker-request';
import { FloatingLabel } from '../models/floating-label';
import { SoftZone } from '../models/soft-zone';
import { StickerElement } from '../models/sticker-element';
import { UpdateStickerRequest } from '../models/update-sticker-request';
import { BoardElementsStore } from './board-elements.store';

@Injectable({ providedIn: 'root' })
export class DecorationActionsService {
  private readonly api = inject(BoardApi);
  private readonly store = inject(BoardElementsStore);
  private readonly snackbars = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  createZone(collectionId: string, request: CreateSoftZoneRequest): void {
    this.api
      .createZone(collectionId, request)
      .pipe(
        tap((zone) =>
          this.store.update((elements) => ({ ...elements, zones: [...elements.zones, zone] })),
        ),
        tap(() => this.snackbars.success('snackbar.zoneCreated')),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateZone(collectionId: string, zoneId: string, update: Partial<CreateSoftZoneRequest>): void {
    this.optimisticUpdate(
      'zones',
      zoneId,
      update,
      this.api.updateZone(collectionId, zoneId, update),
    );
  }

  deleteZone(collectionId: string, zoneId: string): void {
    this.deleteElement('zones', zoneId, this.api.deleteZone(collectionId, zoneId));
  }

  createLabel(collectionId: string, request: CreateFloatingLabelRequest): void {
    this.api
      .createLabel(collectionId, request)
      .pipe(
        tap((label) =>
          this.store.update((elements) => ({
            ...elements,
            labels: [...elements.labels, label],
          })),
        ),
        tap(() => this.snackbars.success('snackbar.labelCreated')),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateLabel(
    collectionId: string,
    labelId: string,
    update: Partial<CreateFloatingLabelRequest>,
  ): void {
    this.optimisticUpdate(
      'labels',
      labelId,
      update,
      this.api.updateLabel(collectionId, labelId, update),
    );
  }

  deleteLabel(collectionId: string, labelId: string): void {
    this.deleteElement('labels', labelId, this.api.deleteLabel(collectionId, labelId));
  }

  createSticker(collectionId: string, request: CreateStickerRequest): void {
    this.api
      .createSticker(collectionId, request)
      .pipe(
        tap((sticker) =>
          this.store.update((elements) => ({
            ...elements,
            stickers: [...elements.stickers, sticker],
          })),
        ),
        tap(() => this.snackbars.success('snackbar.stickerCreated')),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateSticker(collectionId: string, stickerId: string, update: UpdateStickerRequest): void {
    this.optimisticUpdate(
      'stickers',
      stickerId,
      update,
      this.api.updateSticker(collectionId, stickerId, update),
    );
  }

  deleteSticker(collectionId: string, stickerId: string): void {
    this.deleteElement('stickers', stickerId, this.api.deleteSticker(collectionId, stickerId));
  }

  private optimisticUpdate<
    K extends 'zones' | 'labels' | 'stickers',
    T extends SoftZone | FloatingLabel | StickerElement,
  >(key: K, id: string, update: Partial<T>, request: Observable<T>): void {
    const previous = (this.store.elements()[key] as T[]).find((element) => element.id === id);
    if (!previous) return;
    this.store.replaceInList(key, id, { ...previous, ...update } as T);
    request
      .pipe(
        tap((element) => this.store.replaceInList(key, id, element)),
        catchError((error) => {
          this.store.replaceInList(key, id, previous);
          return this.store.handleError(error);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private deleteElement(
    key: 'zones' | 'labels' | 'stickers',
    id: string,
    request: Observable<void>,
  ): void {
    request
      .pipe(
        tap(() => this.store.removeFromList(key, id)),
        catchError((error) => this.store.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
