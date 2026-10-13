import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { SessionContextStore } from './session-context.store';
import { SnackbarService } from './snackbar.service';
import { UserFlagsApi } from '../api/user-flags.api';
import { UserFlag } from '../models/tutorial';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly api = inject(UserFlagsApi);
  private readonly session = inject(SessionContextStore);
  private readonly feedback = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly flags = signal<UserFlag[]>([]);
  private readonly loadedUser = signal<string | null>(null);
  private readonly saving = signal(false);
  readonly ready = computed(
    () => !!this.loadedUser() && this.loadedUser() === this.session.userId(),
  );
  readonly isSaving = this.saving.asReadonly();

  constructor() {
    toObservable(this.session.userId)
      .pipe(
        tap(() => {
          this.flags.set([]);
          this.loadedUser.set(null);
        }),
        switchMap((userId) =>
          userId
            ? this.api.list().pipe(
                tap((flags) => {
                  this.flags.set(flags);
                  this.loadedUser.set(userId);
                }),
                catchError(() => {
                  this.feedback.error('onboarding.loadError');
                  return of([]);
                }),
              )
            : of([]),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  hasSeen(key: string): boolean {
    return this.ready() && this.flags().some((flag) => flag.key === key);
  }

  acknowledge(key: string, outcome: UserFlag['outcome'], onSuccess: () => void): void {
    if (this.saving()) return;
    const userId = this.session.userId();
    if (!userId) return;
    this.saving.set(true);
    this.api
      .acknowledge(key, outcome)
      .pipe(
        tap(() => {
          if (this.session.userId() !== userId) return;
          this.flags.update((flags) =>
            flags.some((flag) => flag.key === key)
              ? flags
              : [...flags, { key, outcome, seenAt: new Date().toISOString() }],
          );
          onSuccess();
        }),
        catchError(() => {
          this.feedback.error('onboarding.saveError');
          return of(null);
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
