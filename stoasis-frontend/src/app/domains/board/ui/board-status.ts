import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BoardContext } from '../data/models/board-context';

@Component({
  selector: 'ui-board-status',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (context(); as active) {
      <div class="board-hint">
        {{ 'board.allowed' | translate }}:
        @for (type of active.allowedTypes; track type; let last = $last) {
          {{ 'pin.type.' + type | translate }}{{ last ? '' : ', ' }}
        }
        · {{ 'board.yourRole' | translate }}:
        {{ 'role.' + (active.currentUserRole || 'guest') | translate }}
      </div>
    }
    @if (error()) {
      <div class="board-error" role="alert">{{ error() | translate }}</div>
    }
  `,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardStatusComponent {
  readonly context = input<BoardContext | null>(null);
  readonly error = input<string | null>(null);
}
