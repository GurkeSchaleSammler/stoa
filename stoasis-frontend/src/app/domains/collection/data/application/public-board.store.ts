import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { Pin } from '../../../../shared/models/pin';
import { PublicCollectionApi } from '../api/public-collection.api';
import { PublicCollection } from '../models/public-collection';

@Injectable()
export class PublicBoardStore {
  private readonly api = inject(PublicCollectionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly collectionState = signal<PublicCollection | null>(null);
  private readonly pinState = signal<Pin[]>([]);
  private readonly statusState = signal<'loading' | 'ready' | 'forbidden' | 'not-found' | 'error'>(
    'loading',
  );

  readonly collection = this.collectionState.asReadonly();
  readonly pins = this.pinState.asReadonly();
  readonly status = this.statusState.asReadonly();

  load(id: string, token?: string): void {
    this.collectionState.set(null);
    this.pinState.set([]);
    this.statusState.set('loading');
    forkJoin({ collection: this.api.detail(id, token), pins: this.api.pins(id, token) })
      .pipe(
        tap(({ collection, pins }) => {
          this.collectionState.set(collection);
          this.pinState.set(pins);
          this.statusState.set('ready');
        }),
        catchError((error: HttpErrorResponse) => {
          this.statusState.set(
            error.status === 403 ? 'forbidden' : error.status === 404 ? 'not-found' : 'error',
          );
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
