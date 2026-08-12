import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { BoardApi } from '../api/board.api';
import { LinkPreview } from '../models/board.models';
import { SnackbarService } from '../../../../shared/application/snackbar.service';

@Injectable({ providedIn: 'root' })
export class LinkParserService {
  private readonly api = inject(BoardApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly request = new Subject<string>();
  private readonly previewState = signal<LinkPreview | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  readonly preview = computed(() => this.previewState());
  readonly isLoading = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());

  private readonly parserSubscription = this.request
    .pipe(
      debounceTime(350),
      distinctUntilChanged(),
      filter((url) => url.length > 5),
      tap(() => {
        this.loadingState.set(true);
        this.errorState.set(null);
      }),
      switchMap((url) =>
        this.api.parseLink(url).pipe(
          catchError(() => {
            this.previewState.set({
              url,
              title: url,
              description: null,
              imageUrl: null,
              siteName: null,
              readingTimeMin: null,
              parseStatus: 'failed',
            });
            this.errorState.set('errors.linkPreview');
            this.snackbars.error('errors.linkPreview');
            this.loadingState.set(false);
            return EMPTY;
          }),
        ),
      ),
      tap((preview) => this.previewState.set(preview)),
      tap(() => this.loadingState.set(false)),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe();

  parseMetadata(url: string): void {
    if (!url.trim()) {
      this.previewState.set(null);
      this.errorState.set(null);
      return;
    }
    this.request.next(url.trim());
  }

  reset(): void {
    this.previewState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
