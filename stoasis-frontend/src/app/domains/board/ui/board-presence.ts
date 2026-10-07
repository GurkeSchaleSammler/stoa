import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BoardParticipant, BoardPresenceStatus } from '../data/models/board-presence';

@Component({
  selector: 'ui-board-presence',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (participants().length || status() === 'reconnecting' || status() === 'unavailable') {
      <div class="presence" role="status" aria-live="polite">
        @if (status() === 'unavailable') {
          <span>{{ 'board.presence.unavailable' | translate }}</span>
        } @else if (status() === 'reconnecting') {
          <span>{{ 'board.presence.reconnecting' | translate }}</span>
        } @else {
          <span class="live-dot" aria-hidden="true"></span>
          <span>{{ 'board.presence.here' | translate: { count: participants().length } }}</span>
          <span class="people" [title]="names()">{{ names() }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .presence {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 24px;
      background: var(--surface-raised);
      border-bottom: 1px solid var(--border);
      color: var(--muted);
      font-size: 12px;
    }
    .live-dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
    }
    .people {
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class BoardPresenceComponent {
  readonly participants = input<BoardParticipant[]>([]);
  readonly status = input<BoardPresenceStatus>('idle');
  readonly names = computed(() =>
    this.participants()
      .map((person) => person.name)
      .join(', '),
  );
}
