import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { SearchApi } from '../api/search.api';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { initialSearchState } from '../models/initial-search-state';
import { SearchState } from '../models/search-state';
import { SearchQuery } from '../models/search-query';
import { PinType } from '../../../../shared/models/pin-type';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(SearchApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly state = signal<SearchState>(initialSearchState);
  private readonly requests = new Subject<SearchQuery>();
  readonly query = computed(() => this.state().query);
  readonly activeFilters = computed(() => this.state().activeFilters);
  readonly results = computed(() => this.state().results);
  readonly status = computed(() => this.state().status);
  readonly isLoading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().error);
  readonly hasQuery = computed(() => this.state().query.trim().length > 0);

  constructor() {
    this.requests
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => this.state.update((state) => ({ ...state, status: 'loading', error: null }))),
        switchMap((query) =>
          this.api.search(query).pipe(
            catchError((error) => {
              this.handleError(error);
              return EMPTY;
            }),
          ),
        ),
        tap((results) => this.state.update((state) => ({ ...state, results, status: 'idle' }))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  search(query: string): void {
    const value = query.trim();
    this.state.update((state) => ({ ...state, query: value }));
    if (!value) {
      this.clear();
      return;
    }
    this.enqueue();
  }

  setFilter(type: PinType | null, tag: string | null): void {
    this.state.update((state) => ({ ...state, activeFilters: { type, tag } }));
    if (this.hasQuery()) this.enqueue();
  }

  clear(): void {
    this.state.set({ ...initialSearchState, activeFilters: this.state().activeFilters });
  }
  clearError(): void {
    this.state.update((state) => ({ ...state, error: null }));
  }
  private enqueue(): void {
    const state = this.state();
    this.requests.next({
      q: state.query,
      type: state.activeFilters.type ?? undefined,
      tag: state.activeFilters.tag ?? undefined,
    });
  }
  private handleError(error: unknown): void {
    const message = (error as { error?: { message?: string } })?.error?.message ?? 'errors.search';
    this.state.update((state) => ({ ...state, status: 'error', error: message }));
    this.snackbars.error(message);
  }
}
