import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { LanguageService } from '../../../shared/application/language-service';
import { I18nPipe } from '../../../shared/ui/i18n.pipe';
import { StoaQlSuggestion } from '../data/models/stoaql-completion';
import {
  StoaQlHistoryItem,
  StoaQlQueryError,
  StoaQlQueryResponse,
} from '../data/models/stoaql-query';
import { BoardConsoleHistoryComponent } from './board-console-history';

@Component({
  selector: 'ui-board-console',
  standalone: true,
  imports: [RouterLink, AppIconComponent, TranslatePipe, I18nPipe, BoardConsoleHistoryComponent],
  template: `
    @if (isOpen()) {
      <div class="stoaql-backdrop" (click)="close.emit()">
        <section
          class="stoaql-console"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="'board.consoleTitle' | translate"
          (click)="$event.stopPropagation()"
        >
          <header class="stoaql-header">
            <div class="stoaql-title">
              <span class="stoaql-terminal-icon"><ui-app-icon name="terminal" /></span>
              <div>
                <p>StoaQL 1.0</p>
                <h2>{{ 'board.consoleTitle' | translate }}</h2>
              </div>
            </div>
            <div class="stoaql-header-actions">
              <span class="stoaql-board-context">
                <i></i>{{ 'board.consoleCurrentBoard' | translate }}
                <strong>{{ boardName() }}</strong>
              </span>
              <button
                type="button"
                class="stoaql-close"
                (click)="close.emit()"
                [attr.aria-label]="'common.close' | translate"
              >
                <ui-app-icon name="close" />
              </button>
            </div>
          </header>

          <div class="stoaql-body">
            <p class="stoaql-hint">{{ 'board.consoleHint' | translate }}</p>

            <div class="stoaql-command-shell">
              <div class="stoaql-command-row">
                <span class="stoaql-prompt">›</span>
                <input
                  #commandInput
                  type="text"
                  spellcheck="false"
                  autocomplete="off"
                  [value]="query()"
                  [placeholder]="'board.consolePlaceholder' | translate"
                  (input)="queryChange.emit(commandInput.value)"
                  (keydown)="onCommandKeydown($event)"
                />
                <button
                  type="button"
                  class="stoaql-run"
                  [disabled]="isRunning() || !query().trim()"
                  (click)="execute.emit()"
                >
                  <ui-app-icon name="send" />
                  {{ (isRunning() ? 'board.consoleRunning' : 'board.consoleRun') | translate }}
                </button>
              </div>
            </div>

            <div class="stoaql-options">
              <label>
                <input
                  type="checkbox"
                  [checked]="dryRun()"
                  (change)="dryRunChange.emit($any($event.target).checked)"
                />
                <span class="stoaql-checkbox"><ui-app-icon name="check" /></span>
                {{ 'board.consoleDryRun' | translate }}
              </label>
              <div class="stoaql-keyboard-hints">
                @if (history().length) {
                  <span><kbd>↑↓</kbd> {{ 'board.consoleHistory' | translate }}</span>
                }
                <span><kbd>Enter ↵</kbd> {{ 'board.consoleRunHint' | translate }}</span>
              </div>
            </div>

            @if (suggestions().length) {
              <div
                class="stoaql-suggestions"
                [attr.aria-label]="'board.consoleSuggestions' | translate"
              >
                @for (suggestion of suggestions(); track suggestion.label; let index = $index) {
                  <button type="button" (click)="suggestionSelect.emit(index)">
                    <strong>{{ suggestion.label }}</strong>
                    <span>{{ suggestion.detail }}</span>
                  </button>
                }
              </div>
            }

            <section class="stoaql-output-panel">
              <nav class="stoaql-output-nav" [attr.aria-label]="'board.consoleOutput' | translate">
                <div>
                  <button
                    type="button"
                    [class.active]="!historyVisible()"
                    (click)="historyVisibleChange.emit(false)"
                  >
                    {{ 'board.consoleResult' | translate }}
                  </button>
                  <button
                    type="button"
                    [class.active]="historyVisible()"
                    (click)="historyVisibleChange.emit(true)"
                  >
                    {{ 'board.consoleHistory' | translate }}
                    @if (history().length) {
                      <span>{{ history().length }}</span>
                    }
                  </button>
                </div>
                <a routerLink="/stoaql-docs">
                  {{ 'board.consoleDocs' | translate }} <ui-app-icon name="external" />
                </a>
              </nav>

              <div class="stoaql-output" aria-live="polite">
                @if (historyVisible()) {
                  <ui-board-console-history
                    [items]="history()"
                    [isLoading]="historyLoading()"
                    (select)="historySelect.emit($event)"
                    (clear)="historyClear.emit()"
                  />
                } @else if (error(); as currentError) {
                  <section class="stoaql-error">
                    <div class="stoaql-result-heading">
                      <span class="result-icon"><ui-app-icon name="warning" /></span>
                      <div>
                        <p>{{ 'board.consoleFailed' | translate }}</p>
                        <strong>{{ currentError.code }}</strong>
                      </div>
                      <code>1:{{ currentError.column }}</code>
                    </div>
                    <p>{{ currentError.message | i18n: currentLanguageKey() }}</p>
                    @if (currentError.hint) {
                      <small>{{ currentError.hint | i18n: currentLanguageKey() }}</small>
                    }
                  </section>
                } @else if (response(); as currentResponse) {
                  <section class="stoaql-success">
                    <div class="stoaql-result-heading">
                      <span class="result-icon"><ui-app-icon name="check" /></span>
                      <div>
                        <p>{{ 'board.consoleSuccess' | translate }}</p>
                        <strong>{{ currentResponse.queryId }}</strong>
                      </div>
                      <code>{{ currentResponse.durationMs }} ms</code>
                    </div>
                    <div class="stoaql-result-list">
                      @for (operation of currentResponse.operations; track $index) {
                        <div class="stoaql-result-line">
                          <span>{{ operation.statementIndex + 1 }}</span>
                          <code>{{ operation.type }}</code>
                          @if (operation.entityId) {
                            <small>{{ operation.entityId }}</small>
                          }
                        </div>
                      }
                    </div>
                    @for (result of currentResponse.results; track $index) {
                      <div class="stoaql-result-block">
                        <code>{{ result.type }}</code>
                        <pre>{{ format(result.data) }}</pre>
                      </div>
                    }
                    @for (warning of currentResponse.warnings; track warning) {
                      <p class="stoaql-warning"><ui-app-icon name="warning" />{{ warning }}</p>
                    }
                  </section>
                } @else {
                  <div class="stoaql-empty-output">
                    <span>_</span>
                    <h3>{{ 'board.consoleEmptyTitle' | translate }}</h3>
                    <p>{{ 'board.consoleEmpty' | translate }}</p>
                    @if (history().length) {
                      <button type="button" (click)="historyVisibleChange.emit(true)">
                        {{ 'board.consoleShowHistory' | translate: { count: history().length } }}
                        <ui-app-icon name="chevron-right" />
                      </button>
                    }
                  </div>
                }
              </div>
            </section>
          </div>
        </section>
      </div>
    }
  `,
  styleUrl: './board-console.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardConsoleComponent {
  private readonly languageService = inject(LanguageService);
  readonly currentLanguageKey = this.languageService.currentLanguageKey;
  readonly isOpen = input(false);
  readonly boardName = input.required<string>();
  readonly query = input('');
  readonly dryRun = input(false);
  readonly isRunning = input(false);
  readonly response = input<StoaQlQueryResponse | null>(null);
  readonly error = input<StoaQlQueryError | null>(null);
  readonly suggestions = input<StoaQlSuggestion[]>([]);
  readonly history = input<StoaQlHistoryItem[]>([]);
  readonly historyLoading = input(false);
  readonly historyVisible = input(false);
  readonly close = output<void>();
  readonly queryChange = output<string>();
  readonly dryRunChange = output<boolean>();
  readonly suggestionSelect = output<number>();
  readonly historyVisibleChange = output<boolean>();
  readonly historySelect = output<string>();
  readonly historyClear = output<void>();
  readonly historyPrevious = output<void>();
  readonly historyNext = output<void>();
  readonly execute = output<void>();

  onCommandKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      this.execute.emit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
    } else if (event.key === 'ArrowUp' && this.history().length) {
      event.preventDefault();
      this.historyPrevious.emit();
    } else if (event.key === 'ArrowDown' && this.history().length) {
      event.preventDefault();
      this.historyNext.emit();
    }
  }

  format(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
