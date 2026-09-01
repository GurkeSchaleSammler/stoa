import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StoaQlHistoryItem } from '../data/models/stoaql-query';
import { AppIconComponent } from '../../../shared/ui/app-icon';

@Component({
  selector: 'ui-board-console-history',
  standalone: true,
  imports: [DatePipe, TranslatePipe, AppIconComponent],
  template: `
    <section class="console-history" [attr.aria-label]="'board.consoleHistory' | translate">
      <header>
        <div>
          <p>{{ 'board.consoleHistory' | translate }}</p>
          <span>{{ items().length }} / 30</span>
        </div>
        @if (items().length) {
          <button type="button" (click)="clear.emit()">
            <ui-app-icon name="trash" /> {{ 'board.consoleClearHistory' | translate }}
          </button>
        }
      </header>

      @if (isLoading()) {
        <div class="history-state">
          <span class="history-pulse"></span>
          <p>{{ 'board.consoleHistoryLoading' | translate }}</p>
        </div>
      } @else if (!items().length) {
        <div class="history-state">
          <span class="history-empty">↟</span>
          <h3>{{ 'board.consoleHistoryEmpty' | translate }}</h3>
        </div>
      } @else {
        <div class="history-list">
          @for (item of items(); track item.id) {
            <button type="button" class="history-item" (click)="select.emit(item.query)">
              <span class="history-status" [class.failed]="!item.success">
                <ui-app-icon [name]="item.success ? 'check' : 'warning'" />
              </span>
              <span class="history-query">
                <code>{{ item.query }}</code>
                <small>
                  {{ item.createdAt | date: 'dd.MM., HH:mm' }}
                  @if (item.dryRun) {
                    · Dry Run
                  }
                  @if (item.durationMs !== null && item.durationMs !== undefined) {
                    · {{ item.durationMs }} ms
                  }
                  @if (item.errorCode) {
                    · {{ item.errorCode }}
                  }
                </small>
              </span>
              <span class="history-use">
                {{ 'board.consoleUseQuery' | translate }} <ui-app-icon name="chevron-right" />
              </span>
            </button>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './board-console-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardConsoleHistoryComponent {
  readonly items = input<StoaQlHistoryItem[]>([]);
  readonly isLoading = input(false);
  readonly select = output<string>();
  readonly clear = output<void>();
}
