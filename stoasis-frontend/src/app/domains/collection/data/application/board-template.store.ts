import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { LanguageService } from '../../../../shared/application/language-service';
import { CollectionApi } from '../api/collection.api';
import { BoardTemplate } from '../models/board-template';

@Injectable()
export class BoardTemplateStore {
  private readonly api = inject(CollectionApi);
  private readonly language = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly itemsState = signal<BoardTemplate[]>([]);
  private readonly statusState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly items = this.itemsState.asReadonly();
  readonly status = this.statusState.asReadonly();
  constructor() {
    toObservable(this.language.currentLanguageKey)
      .pipe(
        tap(() => this.statusState.set('loading')),
        switchMap((language) =>
          this.api.templates(language).pipe(
            tap((items) => {
              this.itemsState.set(items);
              this.statusState.set('ready');
            }),
            catchError(() => {
              this.statusState.set('error');
              return of([]);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
