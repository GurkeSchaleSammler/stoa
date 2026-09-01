import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { StoaQlApi } from '../data/api/stoaql.api';
import { stoaQlSuggestions } from '../data/models/stoaql-completion';
import {
  StoaQlHistoryItem,
  StoaQlQueryError,
  StoaQlQueryResponse,
} from '../data/models/stoaql-query';
import { BoardConsoleComponent } from '../ui/board-console';
import { CollectionService } from '../../collection/data/application/collection.service';

@Component({
  selector: 'feature-board-console-handler',
  standalone: true,
  imports: [BoardConsoleComponent],
  template: `
    <ui-board-console
      [isOpen]="isOpen()"
      [boardName]="boardName()"
      [query]="query()"
      [dryRun]="dryRun()"
      [isRunning]="isRunning()"
      [response]="response()"
      [error]="error()"
      [suggestions]="suggestions()"
      [history]="history()"
      [historyLoading]="historyLoading()"
      [historyVisible]="historyVisible()"
      (close)="close.emit()"
      (queryChange)="setQuery($event)"
      (dryRunChange)="dryRun.set($event)"
      (suggestionSelect)="applySuggestion($event)"
      (historyVisibleChange)="historyVisible.set($event)"
      (historySelect)="selectHistoryQuery($event)"
      (historyClear)="clearHistory()"
      (historyPrevious)="navigateHistory('previous')"
      (historyNext)="navigateHistory('next')"
      (execute)="run()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardConsoleHandlerComponent {
  readonly isOpen = input(false);
  readonly collectionId = input.required<string>();
  readonly boardName = input.required<string>();
  readonly close = output<void>();
  readonly executed = output<void>();
  readonly query = signal('');
  readonly dryRun = signal(false);
  readonly isRunning = signal(false);
  readonly response = signal<StoaQlQueryResponse | null>(null);
  readonly error = signal<StoaQlQueryError | null>(null);
  readonly history = signal<StoaQlHistoryItem[]>([]);
  readonly historyLoading = signal(false);
  readonly historyVisible = signal(false);
  readonly suggestions = computed(() =>
    stoaQlSuggestions(this.query(), [
      ...this.collections.collections().map((collection) => collection.name),
      this.boardName(),
    ]).slice(0, 8),
  );
  private readonly api = inject(StoaQlApi);
  private readonly collections = inject(CollectionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly historyIndex = signal(-1);
  private historyDraft = '';

  constructor() {
    effect(() => {
      if (this.isOpen()) this.loadHistory(this.collectionId());
    });
  }

  setQuery(query: string): void {
    this.query.set(query);
    this.error.set(null);
    this.historyIndex.set(-1);
  }

  applySuggestion(index: number): void {
    const suggestion = this.suggestions()[index];
    if (!suggestion) return;
    this.query.update(
      (query) => `${query.slice(0, suggestion.replaceFrom)}${suggestion.insertText}`,
    );
  }

  selectHistoryQuery(query: string): void {
    this.query.set(query);
    this.error.set(null);
    this.response.set(null);
    this.historyVisible.set(false);
    this.historyIndex.set(-1);
  }

  navigateHistory(direction: 'previous' | 'next'): void {
    const entries = this.history();
    if (!entries.length) return;
    const current = this.historyIndex();
    if (direction === 'previous') {
      if (current === -1) this.historyDraft = this.query();
      const next = Math.min(current + 1, entries.length - 1);
      this.historyIndex.set(next);
      this.query.set(entries[next].query);
      return;
    }
    if (current <= 0) {
      this.historyIndex.set(-1);
      this.query.set(this.historyDraft);
      return;
    }
    const next = current - 1;
    this.historyIndex.set(next);
    this.query.set(entries[next].query);
  }

  clearHistory(): void {
    if (this.historyLoading()) return;
    this.historyLoading.set(true);
    this.api
      .clearHistory(this.collectionId())
      .pipe(
        tap(() => {
          this.history.set([]);
          this.historyIndex.set(-1);
        }),
        catchError(() => EMPTY),
        finalize(() => this.historyLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  run(): void {
    const query = this.query().trim();
    if (!query || this.isRunning()) return;
    this.isRunning.set(true);
    this.error.set(null);
    this.response.set(null);
    this.api
      .execute(this.collectionId(), query, this.dryRun())
      .pipe(
        tap((response) => {
          this.response.set(response);
          this.historyVisible.set(false);
          this.loadHistory(this.collectionId());
          if (!response.dryRun) this.executed.emit();
        }),
        catchError((httpError) => {
          const error = (httpError as { error?: { error?: StoaQlQueryError } })?.error?.error;
          this.error.set(
            error ?? {
              code: 'STOAQL_REQUEST_FAILED',
              message: {
                de: 'Die Query konnte nicht ausgeführt werden.',
                en: 'The query could not be executed.',
                fr: "La requête n'a pas pu être exécutée.",
                it: 'Non è stato possibile eseguire la query.',
              },
              line: 1,
              column: 1,
            },
          );
          this.historyVisible.set(false);
          this.loadHistory(this.collectionId());
          return EMPTY;
        }),
        finalize(() => this.isRunning.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadHistory(collectionId: string): void {
    this.historyLoading.set(true);
    this.api
      .history(collectionId)
      .pipe(
        tap((entries) => this.history.set(entries)),
        catchError(() => {
          this.history.set([]);
          return EMPTY;
        }),
        finalize(() => this.historyLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
