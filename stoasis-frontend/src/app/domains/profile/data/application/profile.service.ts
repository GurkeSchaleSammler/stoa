import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { ProfileApi } from '../api/profile.api';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { ExportFormat } from '../models/export-format';
import { ProfileState } from '../models/profile-state';
import { UpdateProfileRequest } from '../models/update-profile-request';

/** Manages the current profile and account actions. */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ProfileApi);
  private readonly session = inject(SessionContextStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  private readonly state = signal<ProfileState>({
    user: this.session.user(),
    status: 'idle',
    error: null,
    success: null,
  });
  readonly user = computed(() => this.state().user ?? this.session.user());
  readonly isSaving = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().error);
  readonly success = computed(() => this.state().success);
  updateProfile(request: UpdateProfileRequest, onSuccess?: () => void): void {
    this.state.update((s) => ({ ...s, status: 'loading', error: null, success: null }));
    this.api
      .update(request)
      .pipe(
        tap((user) => {
          this.session.setUser(user);
          this.state.set({
            user,
            status: 'idle',
            error: null,
            success: 'profile.saved',
          });
          this.snackbars.success('snackbar.profileUpdated');
          onSuccess?.();
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.clearLoading()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  uploadAvatar(file: File, onSuccess: (avatarUrl: string) => void): void {
    this.state.update((state) => ({ ...state, status: 'loading', error: null, success: null }));
    this.api
      .uploadAvatar(file)
      .pipe(
        tap((upload) => {
          onSuccess(upload.imageUrl);
          this.snackbars.success('snackbar.avatarUploaded');
        }),
        catchError((error) => this.handleError(error, 'errors.avatarUpload')),
        finalize(() => this.clearLoading()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  deleteAccount(): void {
    this.state.update((s) => ({ ...s, status: 'loading', error: null }));
    this.api
      .delete()
      .pipe(
        tap(() => {
          this.snackbars.success('snackbar.accountDeleted');
          this.session.setUser(null);
          void this.router.navigate(['/auth/login'], { queryParams: { accountDeleted: '1' } });
        }),
        catchError((error) => this.handleError(error)),
        finalize(() => this.clearLoading()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  exportData(format: ExportFormat, scope: 'boards' | 'account' = 'boards'): Observable<Blob> {
    return this.api.export(format, scope);
  }
  logout(): void {
    this.api
      .logout()
      .pipe(
        tap(() => {
          this.session.setUser(null);
          this.snackbars.success('snackbar.loggedOut');
          void this.router.navigateByUrl('/auth/login');
        }),
        catchError(() => {
          this.snackbars.error('errors.logout');
          this.session.setUser(null);
          void this.router.navigateByUrl('/auth/login');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  clearMessages(): void {
    this.state.update((s) => ({ ...s, error: null, success: null }));
  }
  private clearLoading(): void {
    if (this.state().status === 'loading') this.state.update((s) => ({ ...s, status: 'idle' }));
  }
  private handleError(error: unknown, fallback = 'errors.profile') {
    const message = (error as { error?: { message?: string } })?.error?.message ?? fallback;
    this.state.update((s) => ({ ...s, status: 'error', error: message }));
    this.snackbars.error(message);
    return EMPTY;
  }
}
