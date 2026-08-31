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
  timeout,
} from 'rxjs';
import { BoardApi } from '../api/board.api';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { LinkPreview } from '../models/link-preview';

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

  constructor() {
    this.request
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((url) => this.isPreviewableUrl(url)),
        tap(() => {
          this.loadingState.set(true);
          this.errorState.set(null);
        }),
        switchMap((url) =>
          this.api.parseLink(url).pipe(
            timeout(8000),
            catchError(() => {
              this.previewState.set(this.fallbackPreview(url, 'failed'));
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
  }

  parseMetadata(url: string): void {
    const trimmed = url.trim();
    if (!trimmed) {
      this.previewState.set(null);
      this.errorState.set(null);
      return;
    }
    if (!this.isPreviewableUrl(trimmed)) {
      this.previewState.set(null);
      this.errorState.set(null);
      this.loadingState.set(false);
      return;
    }
    this.previewState.set(this.fallbackPreview(trimmed, 'pending'));
    this.request.next(trimmed);
  }

  reset(): void {
    this.previewState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
  }

  private isPreviewableUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private fallbackPreview(url: string, parseStatus: LinkPreview['parseStatus']): LinkPreview {
    const host = this.previewHost(url);
    return {
      url,
      title: url,
      description: null,
      imageUrl: null,
      siteName: host,
      readingTimeMin: null,
      parseStatus,
    };
  }

  private previewHost(url: string): string | null {
    try {
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch {
      return null;
    }
  }
}
