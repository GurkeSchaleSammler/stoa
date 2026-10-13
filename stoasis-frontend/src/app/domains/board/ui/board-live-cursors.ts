import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { boardCursorColor, BoardParticipant } from '../data/models/board-presence';

@Component({
  selector: 'ui-board-live-cursors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (person of participants(); track person.userId) {
      @if (person.cursor; as cursor) {
        <div
          class="live-cursor"
          [style.transform]="'translate(' + cursor.x + 'px,' + cursor.y + 'px)'"
          [style.--cursor-color]="color(person.userId)"
        >
          <div class="cursor-marker" [style.transform]="'scale(' + 1 / zoom() + ')'">
            <svg width="24" height="28" viewBox="0 0 24 28" focusable="false">
              <path d="M2 2 L3 22 L9 16 L14 26 L18 24 L13 14 L22 14 Z" />
            </svg>
            <span>{{ person.name }}</span>
          </div>
        </div>
      }
    }
  `,
  styleUrl: './board-live-cursors.scss',
})
export class BoardLiveCursorsComponent {
  readonly participants = input<BoardParticipant[]>([]);
  readonly zoom = input(1);
  readonly color = boardCursorColor;
}
