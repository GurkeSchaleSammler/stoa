import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { ProfileApi } from '../api/profile.api';
import { ImportResult } from '../models/profile.models';
import { SnackbarService } from '../../../../shared/application/snackbar.service';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly api = inject(ProfileApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly resultState = signal<ImportResult | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  readonly result = computed(() => this.resultState());
  readonly isImporting = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());
  importPocketCsv(file: File): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .importPocket(file)
      .pipe(
        tap((result) => {
          this.resultState.set(result);
          this.snackbars.success('snackbar.importCompleted');
        }),
        catchError((error) => {
          this.errorState.set(
            (error as { error?: { message?: string } })?.error?.message ?? 'errors.pocketImport',
          );
          this.snackbars.error(this.errorState() ?? 'errors.pocketImport');
          return EMPTY;
        }),
        finalize(() => this.loadingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
