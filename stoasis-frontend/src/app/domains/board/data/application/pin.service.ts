import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, forkJoin, Subscription, tap } from 'rxjs';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { BoardApi } from '../api/board.api';
import { BoardState } from '../models/board-state';
import { initialBoardState } from '../models/initial-board-state';
import { PinType } from '../../../../shared/models/pin-type';
import { Pin } from '../../../../shared/models/pin';
import { canEdit } from '../../../../shared/models/can-edit';
import { BoardViewMode } from '../../../../shared/models/board-view-mode';
import { CreatePinRequest } from '../models/create-pin-request';
import { UpdatePinRequest } from '../models/update-pin-request';
import { UpdateGridBlockRequest } from '../models/update-grid-block-request';
import { StackBlock } from '../models/stack-block';
import { BoardColorVariant } from '../models/board-color-variant';
import { CreateSoftZoneRequest } from '../models/create-soft-zone-request';
import { CreateFloatingLabelRequest } from '../models/create-floating-label-request';
import { CreateStickerRequest } from '../models/create-sticker-request';
import { UpdateStickerRequest } from '../models/update-sticker-request';
import { PinComment } from '../../../../shared/models/pin-comment';
import { BoardElements } from '../models/board-elements';
import { SoftZone } from '../models/soft-zone';
import { FloatingLabel } from '../models/floating-label';
import { StickerElement } from '../models/sticker-element';

@Injectable({ providedIn: 'root' })
export class PinService {
  private readonly api = inject(BoardApi);
  private readonly session = inject(SessionContextStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly state = signal<BoardState>(initialBoardState);
  private boardLoad?: Subscription;
  private readonly gridUpdateVersions = new Map<string, number>();

  readonly pins = computed(() => this.state().pins);
  readonly elements = computed(() => this.state().elements);
  readonly stacks = computed(() => this.state().elements.stacks);
  readonly connectors = computed(() => this.state().elements.connectors);
  readonly zones = computed(() => this.state().elements.zones);
  readonly labels = computed(() => this.state().elements.labels);
  readonly stickers = computed(() => this.state().elements.stickers);
  readonly sortedPins = computed(() =>
    [...this.state().pins].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  readonly context = computed(() => this.state().context);
  readonly selectedPinId = computed(() => this.state().selectedPinId);
  readonly selectedPin = computed(
    () => this.state().pins.find((pin) => pin.id === this.state().selectedPinId) ?? null,
  );
  readonly viewMode = computed(() => this.state().viewMode);
  readonly status = computed(() => this.state().status);
  readonly isLoading = computed(() => this.state().status === 'loading');
  readonly isMutating = computed(() => this.state().isMutating);
  readonly error = computed(() => this.state().error);
  readonly canEdit = computed(() => canEdit(this.state().context?.currentUserRole ?? null));

  pinsByType(type: PinType): Pin[] {
    return this.sortedPins().filter((pin) => pin.type === type);
  }

  loadPins(collectionId: string): void {
    this.boardLoad?.unsubscribe();
    this.state.set({ ...initialBoardState, viewMode: this.state().viewMode, status: 'loading' });
    this.boardLoad = forkJoin({
      context: this.api.context(collectionId),
      pins: this.api.list(collectionId),
      elements: this.api.elements(collectionId),
    })
      .pipe(
        tap(({ context, pins, elements }) =>
          this.state.update((state) => ({ ...state, context, pins, elements, status: 'idle' })),
        ),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  setViewMode(viewMode: BoardViewMode): void {
    this.state.update((state) => ({ ...state, viewMode }));
  }
  selectPin(pinId: string | null): void {
    this.state.update((state) => ({ ...state, selectedPinId: pinId }));
  }

  createPin(collectionId: string, request: CreatePinRequest, onSuccess?: () => void): void {
    this.setMutating(true);
    this.api
      .create(collectionId, request)
      .pipe(
        tap((pin) => {
          this.state.update((state) => ({ ...state, pins: [...state.pins, pin], error: null }));
          this.snackbars.success('snackbar.pinCreated');
          onSuccess?.();
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setMutating(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updatePin(
    collectionId: string,
    pinId: string,
    request: UpdatePinRequest,
    onSuccess?: () => void,
  ): void {
    this.setMutating(true);
    this.api
      .update(collectionId, pinId, request)
      .pipe(
        tap((updated) => {
          this.state.update((state) => ({
            ...state,
            pins: state.pins.map((pin) => (pin.id === updated.id ? updated : pin)),
            error: null,
          }));
          this.snackbars.success('snackbar.pinUpdated');
          onSuccess?.();
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setMutating(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  deletePin(collectionId: string, pinId: string, onSuccess?: () => void): void {
    this.setMutating(true);
    this.api
      .delete(collectionId, pinId)
      .pipe(
        tap(() => {
          this.state.update((state) => ({
            ...state,
            pins: state.pins.filter((pin) => pin.id !== pinId),
            selectedPinId: null,
          }));
          this.snackbars.success('snackbar.pinDeleted');
          onSuccess?.();
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setMutating(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  reorderPin(collectionId: string, pinId: string, newOrder: number): void {
    this.updatePin(collectionId, pinId, { sortOrder: newOrder });
  }

  updateGrid(collectionId: string, pinId: string, grid: UpdateGridBlockRequest): void {
    const previous = this.state().pins.find((pin) => pin.id === pinId);
    if (!previous) return;

    const version = (this.gridUpdateVersions.get(pinId) ?? 0) + 1;
    this.gridUpdateVersions.set(pinId, version);
    this.state.update((state) => ({
      ...state,
      pins: state.pins.map((pin) =>
        pin.id === pinId ? { ...pin, grid: { ...pin.grid, ...grid } } : pin,
      ),
    }));

    this.api
      .update(collectionId, pinId, { grid })
      .pipe(
        tap((updated) => {
          if (this.gridUpdateVersions.get(pinId) !== version) return;
          this.state.update((state) => ({
            ...state,
            pins: state.pins.map((pin) => (pin.id === updated.id ? updated : pin)),
            error: null,
          }));
        }),
        catchError((error) => {
          if (this.gridUpdateVersions.get(pinId) === version) {
            this.state.update((state) => ({
              ...state,
              pins: state.pins.map((pin) => (pin.id === pinId ? previous : pin)),
            }));
          }
          return this.handleError(error);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  createStack(collectionId: string, sourcePinId: string, targetPinId: string): void {
    this.api
      .createStack(collectionId, sourcePinId, targetPinId)
      .pipe(
        tap((stack) => {
          this.updateElements((elements) => ({ ...elements, stacks: [...elements.stacks, stack] }));
          this.snackbars.withAction('snackbar.stackCreated', 'common.undo', () =>
            this.dissolveStack(collectionId, stack.id),
          );
        }),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  addToStack(collectionId: string, stackId: string, pinId: string): void {
    this.api
      .addStackChild(collectionId, stackId, pinId)
      .pipe(
        tap((stack) => this.replaceStack(stack)),
        tap(() => this.snackbars.success('snackbar.stackUpdated')),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateStack(
    collectionId: string,
    stackId: string,
    update: Partial<Pick<StackBlock, 'x' | 'y' | 'layer' | 'expanded'>>,
  ): void {
    const previous = this.state().elements.stacks.find((stack) => stack.id === stackId);
    if (!previous) return;
    this.replaceStack({ ...previous, ...update });
    this.api
      .updateStack(collectionId, stackId, update)
      .pipe(
        tap((stack) => this.replaceStack(stack)),
        catchError((error) => {
          this.replaceStack(previous);
          return this.handleError(error);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  releaseStackChild(
    collectionId: string,
    stackId: string,
    pinId: string,
    grid: Pick<UpdateGridBlockRequest, 'x' | 'y' | 'layer'>,
  ): void {
    this.api
      .releaseStackChild(collectionId, stackId, { pinId, ...grid })
      .pipe(
        tap((elements) => this.setElements(elements)),
        tap(() => this.snackbars.info('snackbar.pinReleased')),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  dissolveStack(collectionId: string, stackId: string): void {
    this.api
      .dissolveStack(collectionId, stackId)
      .pipe(
        tap((elements) => this.setElements(elements)),
        tap(() => this.snackbars.info('snackbar.stackDissolved')),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  createConnector(
    collectionId: string,
    sourcePinId: string,
    targetPinId: string,
    color: BoardColorVariant = 'accent',
  ): void {
    this.api
      .createConnector(collectionId, sourcePinId, targetPinId, color)
      .pipe(
        tap((connector) =>
          this.updateElements((elements) => ({
            ...elements,
            connectors: [...elements.connectors, connector],
          })),
        ),
        tap(() => this.snackbars.success('snackbar.connectorCreated')),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  deleteConnector(collectionId: string, connectorId: string): void {
    this.api
      .deleteConnector(collectionId, connectorId)
      .pipe(
        tap(() =>
          this.updateElements((elements) => ({
            ...elements,
            connectors: elements.connectors.filter((connector) => connector.id !== connectorId),
          })),
        ),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  createZone(collectionId: string, request: CreateSoftZoneRequest): void {
    this.api
      .createZone(collectionId, request)
      .pipe(
        tap((zone) =>
          this.updateElements((elements) => ({ ...elements, zones: [...elements.zones, zone] })),
        ),
        tap(() => this.snackbars.success('snackbar.zoneCreated')),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateZone(collectionId: string, zoneId: string, update: Partial<CreateSoftZoneRequest>): void {
    this.optimisticElementUpdate(
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
          this.updateElements((elements) => ({ ...elements, labels: [...elements.labels, label] })),
        ),
        tap(() => this.snackbars.success('snackbar.labelCreated')),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateLabel(
    collectionId: string,
    labelId: string,
    update: Partial<CreateFloatingLabelRequest>,
  ): void {
    this.optimisticElementUpdate(
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
          this.updateElements((elements) => ({
            ...elements,
            stickers: [...elements.stickers, sticker],
          })),
        ),
        tap(() => this.snackbars.success('snackbar.stickerCreated')),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateSticker(collectionId: string, stickerId: string, update: UpdateStickerRequest): void {
    this.optimisticElementUpdate(
      'stickers',
      stickerId,
      update,
      this.api.updateSticker(collectionId, stickerId, update),
    );
  }

  deleteSticker(collectionId: string, stickerId: string): void {
    this.deleteElement('stickers', stickerId, this.api.deleteSticker(collectionId, stickerId));
  }

  addComment(collectionId: string, pinId: string, body: string): void {
    const temporary: PinComment = {
      authorId: this.session.userId() ?? 'current-user',
      authorName: this.session.user()?.name ?? 'common.you',
      body,
      at: new Date().toISOString(),
      pending: true,
    };
    this.state.update((state) => ({
      ...state,
      pins: state.pins.map((pin) =>
        pin.id === pinId ? { ...pin, comments: [...pin.comments, temporary] } : pin,
      ),
    }));
    this.api
      .addComment(collectionId, pinId, body)
      .pipe(
        tap((saved) =>
          this.state.update((state) => ({
            ...state,
            pins: state.pins.map((pin) =>
              pin.id === pinId
                ? {
                    ...pin,
                    comments: [...pin.comments.filter((comment) => comment !== temporary), saved],
                  }
                : pin,
            ),
          })),
        ),
        tap(() => this.snackbars.success('snackbar.commentAdded')),
        catchError((error) => {
          this.state.update((state) => ({
            ...state,
            pins: state.pins.map((pin) =>
              pin.id === pinId
                ? { ...pin, comments: pin.comments.filter((comment) => comment !== temporary) }
                : pin,
            ),
          }));
          return this.handleError(error);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearError(): void {
    this.state.update((state) => ({ ...state, error: null }));
  }
  private setMutating(isMutating: boolean): void {
    this.state.update((state) => ({ ...state, isMutating }));
  }
  private setElements(elements: BoardElements): void {
    this.state.update((state) => ({ ...state, elements }));
  }
  private updateElements(update: (elements: BoardElements) => BoardElements): void {
    this.state.update((state) => ({ ...state, elements: update(state.elements) }));
  }
  private replaceStack(stack: StackBlock): void {
    this.updateElements((elements) => ({
      ...elements,
      stacks: elements.stacks.map((current) => (current.id === stack.id ? stack : current)),
    }));
  }
  private optimisticElementUpdate<
    K extends 'zones' | 'labels' | 'stickers',
    T extends SoftZone | FloatingLabel | StickerElement,
  >(key: K, id: string, update: Partial<T>, request: import('rxjs').Observable<T>): void {
    const previous = (this.state().elements[key] as T[]).find((element) => element.id === id);
    if (!previous) return;
    this.updateElementList(key, id, { ...previous, ...update } as T);
    request
      .pipe(
        tap((element) => this.updateElementList(key, id, element)),
        catchError((error) => {
          this.updateElementList(key, id, previous);
          return this.handleError(error);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  private updateElementList<K extends 'zones' | 'labels' | 'stickers', T extends { id: string }>(
    key: K,
    id: string,
    element: T,
  ): void {
    this.updateElements((elements) => ({
      ...elements,
      [key]: (elements[key] as unknown as T[]).map((current) =>
        current.id === id ? element : current,
      ),
    }));
  }
  private deleteElement(
    key: 'zones' | 'labels' | 'stickers',
    id: string,
    request: import('rxjs').Observable<void>,
  ): void {
    request
      .pipe(
        tap(() =>
          this.updateElements((elements) => ({
            ...elements,
            [key]: elements[key].filter((element) => element.id !== id),
          })),
        ),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  private handleError(error: unknown) {
    const message = (error as { error?: { message?: string } })?.error?.message ?? 'errors.board';
    this.state.update((state) => ({ ...state, status: 'error', error: message }));
    this.snackbars.error(message);
    return EMPTY;
  }
}
