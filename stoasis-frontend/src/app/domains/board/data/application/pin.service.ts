import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, forkJoin, Subscription, tap } from 'rxjs';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { canEdit } from '../../../../shared/models/core.models';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { BoardApi } from '../api/board.api';
import {
  BoardState,
  BoardViewMode,
  CreatePinRequest,
  initialBoardState,
  Pin,
  PinComment,
  PinType,
  UpdatePinRequest,
} from '../models/board.models';

@Injectable({ providedIn: 'root' })
export class PinService {
  private readonly api = inject(BoardApi);
  private readonly session = inject(SessionContextStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly state = signal<BoardState>(initialBoardState);
  private boardLoad?: Subscription;

  readonly pins = computed(() => this.state().pins);
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
    })
      .pipe(
        tap(({ context, pins }) =>
          this.state.update((state) => ({ ...state, context, pins, status: 'idle' })),
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
  private handleError(error: unknown) {
    const message = (error as { error?: { message?: string } })?.error?.message ?? 'errors.board';
    this.state.update((state) => ({ ...state, status: 'error', error: message }));
    this.snackbars.error(message);
    return EMPTY;
  }
}
