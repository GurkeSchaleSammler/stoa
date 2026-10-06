import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { CollectionApi } from '../api/collection.api';
import { initialCollectionState } from '../models/initial-collection-state';
import { CollectionState } from '../models/collection-state';
import { canEdit } from '../../../../shared/models/can-edit';
import { CollectionFilter } from '../models/collection-filter';
import { CreateCollectionRequest } from '../models/create-collection-request';
import { UpdateCollectionRequest } from '../models/update-collection-request';
import { LanguageService } from '../../../../shared/application/language-service';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly api = inject(CollectionApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly language = inject(LanguageService);
  private readonly state = signal<CollectionState>(initialCollectionState);

  readonly collections = computed(() => this.state().collections);
  readonly activeCollection = computed(() => this.state().activeCollection);
  readonly filter = computed(() => this.state().filter);
  readonly status = computed(() => this.state().status);
  readonly isLoading = computed(() => this.state().status === 'loading');
  readonly isSaving = computed(() => this.state().isSaving);
  readonly error = computed(() => this.state().error);
  readonly canEditActive = computed(() =>
    canEdit(this.state().activeCollection?.currentUserRole ?? null),
  );
  readonly filteredCollections = computed(() => {
    const items = this.state().collections;
    const filter = this.state().filter;
    if (filter === 'personal') return items.filter((item) => item.members.length === 1);
    if (filter === 'shared') return items.filter((item) => item.members.length > 1);
    return items;
  });

  loadCollections(filter: CollectionFilter = 'all'): void {
    this.state.update((state) => ({ ...state, filter, status: 'loading', error: null }));
    this.api
      .list(filter)
      .pipe(
        tap((collections) =>
          this.state.update((state) => ({ ...state, collections, status: 'idle' })),
        ),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  loadCollection(id: string): void {
    this.state.update((state) => ({ ...state, status: 'loading', error: null }));
    this.api
      .detail(id)
      .pipe(
        tap((activeCollection) =>
          this.state.update((state) => ({ ...state, activeCollection, status: 'idle' })),
        ),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  setActive(id: string): void {
    const cached = this.state().collections.find((item) => item.id === id);
    if (cached && this.state().activeCollection?.id === cached.id) return;
    this.loadCollection(id);
  }

  setFilter(filter: CollectionFilter): void {
    this.loadCollections(filter);
  }

  create(request: CreateCollectionRequest, onSuccess?: () => void): void {
    if (this.isSaving()) return;
    this.setSaving(true);
    (request.templateId
      ? this.api.createTemplate(request, this.language.currentLanguageKey())
      : this.api.create(request)
    )
      .pipe(
        tap((created) => {
          this.state.update((state) => ({
            ...state,
            collections: [created, ...state.collections],
            activeCollection: created,
            error: null,
          }));
          this.snackbars.success('snackbar.collectionCreated');
          onSuccess?.();
          void this.router.navigate(['/collections', created.id]);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setSaving(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  duplicate(id: string, name: string, onSuccess: () => void): void {
    if (this.isSaving()) return;
    this.setSaving(true);
    this.api
      .duplicate(id, name)
      .pipe(
        tap((created) => {
          this.state.update((state) => ({
            ...state,
            collections: [created, ...state.collections],
            activeCollection: created,
            error: null,
          }));
          this.snackbars.success('templates.duplicated');
          onSuccess();
          void this.router.navigate(['/collections', created.id]);
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setSaving(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  update(id: string, request: UpdateCollectionRequest, onSuccess?: () => void): void {
    this.setSaving(true);
    this.api
      .update(id, request)
      .pipe(
        tap((updated) => {
          this.state.update((state) => ({
            ...state,
            activeCollection: updated,
            collections: state.collections.map((item) =>
              item.id === id ? { ...item, ...updated } : item,
            ),
            error: null,
          }));
          this.snackbars.success('snackbar.collectionUpdated');
          onSuccess?.();
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setSaving(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  delete(id: string, onSuccess?: () => void): void {
    this.setSaving(true);
    this.api
      .delete(id)
      .pipe(
        tap(() => {
          this.state.update((state) => ({
            ...state,
            collections: state.collections.filter((item) => item.id !== id),
            activeCollection: null,
          }));
          this.snackbars.success('snackbar.collectionDeleted');
          onSuccess?.();
          void this.router.navigateByUrl('/');
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setSaving(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  joinViaToken(token: string): void {
    this.api
      .join(token)
      .pipe(
        tap(({ collectionId }) => {
          this.snackbars.success('snackbar.collectionJoined');
          void this.router.navigate(['/collections', collectionId]);
        }),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearError(): void {
    this.state.update((state) => ({ ...state, error: null }));
  }

  private setSaving(isSaving: boolean): void {
    this.state.update((state) => ({ ...state, isSaving }));
  }

  private handleError(error: unknown) {
    const message =
      (error as { error?: { message?: string } })?.error?.message ?? 'errors.collection';
    this.state.update((state) => ({ ...state, status: 'error', error: message }));
    this.snackbars.error(message);
    return EMPTY;
  }
}
