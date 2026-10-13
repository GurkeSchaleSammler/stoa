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
import { PinComment } from '../../../../shared/models/pin-comment';
import { BoardElementsStore } from './board-elements.store';
import { ConnectorActionsService } from './connector-actions.service';
import { DecorationActionsService } from './decoration-actions.service';
import { StackActionsService } from './stack-actions.service';
import { ViewportService } from '../../../../shared/application/viewport.service';

@Injectable({ providedIn: 'root' })
export class PinService {
  private readonly api = inject(BoardApi);
  private readonly session = inject(SessionContextStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly elementStore = inject(BoardElementsStore);
  readonly stackActions = inject(StackActionsService);
  readonly connectorActions = inject(ConnectorActionsService);
  readonly decorationActions = inject(DecorationActionsService);
  private readonly state = signal<BoardState>({
    ...initialBoardState,
    viewMode: inject(ViewportService).compact() ? 'list' : 'board',
  });
  private boardLoad?: Subscription;
  private readonly gridUpdateVersions = new Map<string, number>();

  readonly pins = computed(() => this.state().pins);
  readonly elements = this.elementStore.elements;
  readonly elementsError = this.elementStore.error;
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
    this.elementStore.reset();
    this.boardLoad = forkJoin({
      context: this.api.context(collectionId),
      pins: this.api.list(collectionId),
      elements: this.api.elements(collectionId),
    })
      .pipe(
        tap(({ context, pins, elements }) => {
          this.elementStore.set(elements);
          this.state.update((state) => ({ ...state, context, pins, status: 'idle' }));
        }),
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

  pastePin(
    collectionId: string,
    sourceCollectionId: string,
    pinId: string,
    onSuccess?: () => void,
  ): void {
    if (this.isMutating() || !this.canEdit()) return;
    this.setMutating(true);
    this.api
      .copyPin(collectionId, sourceCollectionId, pinId)
      .pipe(
        tap((pin) => {
          if (this.context()?.id === collectionId) {
            this.state.update((state) => ({ ...state, pins: [...state.pins, pin], error: null }));
            onSuccess?.();
          }
          this.snackbars.success('templates.pinPasted');
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

  addComment(collectionId: string, pinId: string, body: string): void {
    const temporary: PinComment = {
      authorId: this.session.userId() ?? 'current-user',
      authorName: this.session.user()?.name ?? 'common.you',
      authorAvatarUrl: this.session.user()?.avatarUrl ?? null,
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
  private handleError(error: unknown) {
    const message = (error as { error?: { message?: string } })?.error?.message ?? 'errors.board';
    this.state.update((state) => ({ ...state, status: 'error', error: message }));
    this.snackbars.error(message);
    return EMPTY;
  }
}
