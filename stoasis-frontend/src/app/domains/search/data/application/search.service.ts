import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, switchMap, timer } from 'rxjs';
import { SearchApi } from '../api/search.api';
import { initialSearchState } from '../models/initial-search-state';
import { SearchState } from '../models/search-state';
import { SearchQuery } from '../models/search-query';
import { PinType } from '../../../../shared/models/pin-type';

/** Cancels stale searches and pages current filters without hiding accessible content. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(SearchApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state = signal<SearchState>(initialSearchState);
  private readonly requests = new Subject<SearchQuery>();
  readonly query = computed(() => this.state().query);
  readonly activeFilters = computed(() => this.state().activeFilters);
  readonly results = computed(() => this.state().results);
  readonly status = computed(() => this.state().status);
  readonly isLoading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().error);
  readonly extraTags = signal<string[]>([]);
  readonly tagMode = signal<'all' | 'any'>('all');
  readonly page = signal(0);
  readonly hasNext = computed(() => this.results().length === 50);
  readonly hasQuery = computed(
    () =>
      !!(
        this.query().trim() ||
        this.activeFilters().tag ||
        this.activeFilters().type ||
        this.extraTags().length
      ),
  );
  readonly currentQuery = computed<SearchQuery>(() => ({
    q: this.query(),
    type: this.activeFilters().type ?? undefined,
    tag: this.activeFilters().tag ?? undefined,
    tags: this.extraTags(),
    tagMode: this.tagMode(),
    page: this.page(),
  }));

  constructor() {
    this.requests
      .pipe(
        switchMap((query) =>
          timer(250).pipe(
            switchMap(() => (this.hasQuery() ? this.api.search(query) : of([]))),
            catchError((error) => {
              const message =
                (error as { error?: { message?: string } })?.error?.message ?? 'errors.search';
              this.state.update((state) => ({
                ...state,
                status: 'error',
                error: message,
                results: [],
              }));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        if (results) this.state.update((state) => ({ ...state, results, status: 'idle' }));
      });
  }

  search(query: string): void {
    this.state.update((state) => ({ ...state, query }));
    this.enqueue();
  }

  setFilter(type: PinType | null, tag: string | null): void {
    this.state.update((state) => ({ ...state, activeFilters: { type, tag } }));
    this.enqueue();
  }

  setAdvanced(tags: string[], mode: 'all' | 'any'): void {
    this.extraTags.set([
      ...new Set(
        tags
          .map((tag) => tag.trim().replace(/^#/, '').normalize('NFC').toLowerCase())
          .filter(Boolean),
      ),
    ]);
    this.tagMode.set(mode);
    this.enqueue();
  }

  applySaved(query: SearchQuery): void {
    this.state.update((state) => ({
      ...state,
      query: query.q,
      activeFilters: { type: query.type ?? null, tag: null },
    }));
    this.setAdvanced(query.tags ?? [], query.tagMode ?? 'all');
  }

  goToPage(page: number): void {
    if (page < 0 || this.isLoading()) return;
    this.page.set(page);
    this.enqueue(false);
  }

  clear(): void {
    this.search('');
  }
  clearError(): void {
    this.state.update((state) => ({ ...state, error: null }));
  }

  private enqueue(resetPage = true): void {
    if (resetPage) this.page.set(0);
    this.state.update((state) => ({
      ...state,
      status: this.hasQuery() ? 'loading' : 'idle',
      error: null,
      results: [],
    }));
    this.requests.next(this.currentQuery());
  }
}
