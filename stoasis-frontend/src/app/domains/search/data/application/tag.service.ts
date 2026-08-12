import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { SearchApi } from '../api/search.api';
import { Tag } from '../models/search.models';
import { SnackbarService } from '../../../../shared/application/snackbar.service';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly api = inject(SearchApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly tagsState = signal<Tag[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  readonly tags = computed(() => this.tagsState());
  readonly isLoading = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());

  loadTags(): void {
    this.loadingState.set(true);
    this.api
      .tags()
      .pipe(
        tap((tags) => this.tagsState.set(tags)),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loadingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  createTag(name: string): void {
    this.api
      .createTag(name.trim())
      .pipe(
        tap((tag) => {
          this.tagsState.update((tags) =>
            [...tags, tag].sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.snackbars.success('snackbar.tagCreated');
        }),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  deleteTag(id: string): void {
    this.api
      .deleteTag(id)
      .pipe(
        tap(() => {
          this.tagsState.update((tags) => tags.filter((tag) => tag.id !== id));
          this.snackbars.success('snackbar.tagDeleted');
        }),
        catchError((error) => this.handleError(error)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  private handleError(error: unknown) {
    this.errorState.set(
      (error as { error?: { message?: string } })?.error?.message ?? 'errors.tags',
    );
    this.snackbars.error(this.errorState() ?? 'errors.tags');
    return EMPTY;
  }
}
