import { HttpEventType } from '@angular/common/http';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { Subscription } from 'rxjs';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { BoardApi } from '../api/board.api';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { UploadedPhoto } from '../models/uploaded-photo';

/** Previews selected files and tracks cancellable image uploads. */
@Injectable({ providedIn: 'root' })
export class PhotoUploadService {
  private readonly session = inject(SessionContextStore);
  private request?: Subscription;
  readonly previewUrl = signal<string | null>(null);
  readonly fileName = signal<string | null>(null);
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

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.request?.unsubscribe();
      const url = this.previewUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  upload(file: File): void {
    this.reset();
    const maxBytes = (this.session.user()?.plan === 'premium' ? 20 : 5) * 1024 * 1024;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxBytes) {
      this.errorState.set('pin.invalidPhoto');
      return;
    }
    this.fileName.set(file.name);
    this.previewUrl.set(URL.createObjectURL(file));
    this.loadingState.set(true);
    this.request = this.api
      .upload(file)
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.progressState.set(Math.round((100 * event.loaded) / (event.total ?? file.size)));
          }
          if (event.type === HttpEventType.Response && event.body) {
            this.photoState.set(event.body);
            this.progressState.set(100);
            this.snackbars.success('snackbar.photoUploaded');
          }
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
    this.request?.unsubscribe();
    const photo = this.photoState();
    if (photo)
      this.api
        .discardUpload(photo.fileKey)
        .pipe(
          catchError(() => EMPTY),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe();
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.fileName.set(null);
    this.photoState.set(null);
    this.progressState.set(0);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
