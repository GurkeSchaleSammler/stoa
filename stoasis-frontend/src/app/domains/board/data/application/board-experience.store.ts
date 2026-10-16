import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subscription, catchError, finalize, switchMap, tap } from 'rxjs';
import { BoardExperienceApi } from '../api/board-experience.api';
import { BoardExperience, DateDraft, PathDraft } from '../models/board-experience';

@Injectable()
export class BoardExperienceStore {
  private readonly api = inject(BoardExperienceApi);
  private readonly destroyRef = inject(DestroyRef);
  private boardId = '';
  private request?: Subscription;
  readonly value = signal<BoardExperience | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  load(id: string): void {
    this.request?.unsubscribe();
    this.boardId = id;
    this.value.set(null);
    this.error.set(null);
    this.saving.set(false);
    this.loading.set(true);
    this.request = this.api
      .load(id)
      .pipe(
        tap((value) => this.value.set(value)),
        catchError((error) => this.fail(error)),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  savePath(draft: PathDraft, saved: () => void): void {
    this.mutate(this.api.savePath(this.boardId, draft), saved);
  }
  deletePath(id: string): void {
    this.mutate(this.api.deletePath(this.boardId, id));
  }
  saveDate(draft: DateDraft, saved: () => void): void {
    this.mutate(this.api.saveDate(this.boardId, draft), saved);
  }
  private mutate(request: Observable<unknown>, saved = () => {}): void {
    if (this.saving() || this.loading()) return;
    this.saving.set(true);
    this.error.set(null);
    this.request = request
      .pipe(
        tap(() => saved()),
        switchMap(() => this.api.load(this.boardId)),
        tap((value) => this.value.set(value)),
        catchError((error) => this.fail(error)),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  private fail(error: unknown) {
    const body = (error as { error?: { code?: string; message?: string } })?.error;
    this.error.set(
      body?.code?.startsWith('board.') ? body.code : (body?.message ?? 'errors.board'),
    );
    return EMPTY;
  }
}
