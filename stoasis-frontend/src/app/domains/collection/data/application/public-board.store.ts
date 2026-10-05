import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, Subject, switchMap, tap } from 'rxjs';
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
  private readonly requests = new Subject<{ id: string; token?: string }>();

  readonly collection = this.collectionState.asReadonly();
  readonly pins = this.pinState.asReadonly();
  readonly status = this.statusState.asReadonly();

  constructor() {
    this.requests
      .pipe(
        tap(() => {
          this.collectionState.set(null);
          this.pinState.set([]);
          this.statusState.set('loading');
        }),
        switchMap(({ id, token }) =>
          forkJoin({ collection: this.api.detail(id, token), pins: this.api.pins(id, token) }).pipe(
            map((result) => ({ kind: 'ready' as const, result })),
            catchError((error: HttpErrorResponse) =>
              of({
                kind: (error.status === 403
                  ? 'forbidden'
                  : error.status === 404
                    ? 'not-found'
                    : 'error') as 'forbidden' | 'not-found' | 'error',
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (response.kind !== 'ready') {
          this.statusState.set(response.kind);
          return;
        }
        this.collectionState.set(response.result.collection);
        this.pinState.set(response.result.pins);
        this.statusState.set('ready');
      });
  }

  load(id: string, token?: string): void {
    this.requests.next({ id, token });
  }
}
