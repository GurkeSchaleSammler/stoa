import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { SnackbarService } from '../../../shared/application/snackbar.service';
import { CreateWorldRequest, UpdateWorldRequest, WorldDetail, WorldSummary } from './world.models';
import { WorldApi } from './world.api';

@Injectable({ providedIn: 'root' })
export class WorldStore {
  private readonly api = inject(WorldApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly listState = signal<WorldSummary[]>([]);
  private readonly selectedState = signal<WorldDetail | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly worlds = this.listState.asReadonly();
  readonly selected = this.selectedState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly selectedId = computed(() => this.selectedState()?.id ?? null);

  load(): void {
    this.loadingState.set(true);
    this.api
      .list()
      .pipe(
        tap((worlds) => {
          this.listState.set(worlds);
          const current = this.selectedState();
          if (current && worlds.some((world) => world.id === current.id))
            this.loadDetail(current.id);
          else if (worlds[0]) this.loadDetail(worlds[0].id);
          else this.selectedState.set(null);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loadingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadDetail(id: string): void {
    this.loadingState.set(true);
    this.api
      .detail(id)
      .pipe(
        tap((world) => this.apply(world)),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loadingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  create(request: CreateWorldRequest, onSuccess?: () => void): void {
    this.mutate(this.api.create(request), 'worlds.created', onSuccess);
  }

  update(request: UpdateWorldRequest, onSuccess?: () => void): void {
    const id = this.selectedId();
    if (id) this.mutate(this.api.update(id, request), 'worlds.updated', onSuccess);
  }

  addBoard(collectionId: string): void {
    const id = this.selectedId();
    if (id) this.mutate(this.api.addBoard(id, collectionId), 'worlds.boardAdded');
  }

  removeBoard(collectionId: string): void {
    const id = this.selectedId();
    if (id) this.mutate(this.api.removeBoard(id, collectionId), 'worlds.boardRemoved');
  }

  delete(onSuccess?: () => void): void {
    const id = this.selectedId();
    if (!id || this.savingState()) return;
    this.savingState.set(true);
    this.api
      .delete(id)
      .pipe(
        tap(() => {
          this.listState.update((items) => items.filter((item) => item.id !== id));
          this.selectedState.set(null);
          this.snackbars.success('worlds.deleted');
          onSuccess?.();
          this.load();
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.savingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private mutate(
    request: ReturnType<WorldApi['create']>,
    message: string,
    onSuccess?: () => void,
  ): void {
    if (this.savingState()) return;
    this.savingState.set(true);
    request
      .pipe(
        tap((world) => {
          this.apply(world);
          this.snackbars.success(message);
          onSuccess?.();
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.savingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private apply(world: WorldDetail): void {
    this.selectedState.set(world);
    const summary: WorldSummary = world;
    this.listState.update((items) => {
      const exists = items.some((item) => item.id === world.id);
      return exists
        ? items.map((item) => (item.id === world.id ? summary : item))
        : [summary, ...items];
    });
    this.errorState.set(null);
  }

  private handleError(error: unknown) {
    const message = (error as { error?: { message?: string } })?.error?.message ?? 'worlds.error';
    this.errorState.set(message);
    this.snackbars.error(message);
    return EMPTY;
  }
}
