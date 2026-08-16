import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { BoardApi } from '../api/board.api';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { UploadedPhoto } from '../models/uploaded-photo';

@Injectable({ providedIn: 'root' })
export class PhotoUploadService {
  private readonly api = inject(BoardApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly photoState = signal<UploadedPhoto | null>(null);
  private readonly progressState = signal(0);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  readonly photo = computed(() => this.photoState());
  readonly progress = computed(() => this.progressState());
  readonly isUploading = computed(() => this.loadingState());
  readonly error = computed(() => this.errorState());

  upload(file: File): void {
    this.photoState.set(null);
    this.progressState.set(20);
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api
      .upload(file)
      .pipe(
        tap((photo) => {
          this.photoState.set(photo);
          this.progressState.set(100);
          this.snackbars.success('snackbar.photoUploaded');
        }),
        catchError((error) => {
          this.errorState.set(
            (error as { error?: { message?: string } })?.error?.message ?? 'errors.photoUpload',
          );
          this.snackbars.error(this.errorState() ?? 'errors.photoUpload');
          return EMPTY;
        }),
        finalize(() => this.loadingState.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  reset(): void {
    this.photoState.set(null);
    this.progressState.set(0);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
