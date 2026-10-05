import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, tap } from 'rxjs';
import { CollectionApi } from '../domains/collection/data/api/collection.api';
import { CollectionSummary } from '../domains/collection/data/models/collection-summary';

@Injectable()
export class DashboardCollectionsStore {
  private readonly api = inject(CollectionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly items = signal<CollectionSummary[]>([]);
  private readonly loadStatus = signal<'idle' | 'loading' | 'error'>('idle');

  readonly collections = this.items.asReadonly();
  readonly status = this.loadStatus.asReadonly();

  load(): void {
    this.items.set([]);
    this.loadStatus.set('loading');
    this.api
      .list('all')
      .pipe(
        tap((collections) => {
          this.items.set(collections);
          this.loadStatus.set('idle');
        }),
        catchError(() => {
          this.loadStatus.set('error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
