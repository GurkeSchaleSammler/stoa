import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StickerMotif } from '../data/models/sticker-motif';

@Component({
  selector: 'ui-board-sticker-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      @switch (motif()) {
        @case ('circle') {
          <circle cx="50" cy="50" r="39" />
        }
        @case ('triangle') {
          <path d="M50 10 91 85H9Z" />
        }
        @case ('moon') {
          <path d="M69 13a39 39 0 1 0 17 64A33 33 0 0 1 69 13Z" />
        }
        @case ('blob') {
          <path d="M82 20c17 18 7 57-18 70-24 12-58-3-57-30C7 31 59-5 82 20Z" />
        }
        @case ('star') {
          <path d="m50 8 11 28 30 2-23 19 8 30-26-17-26 17 8-30L9 38l30-2Z" />
        }
        @case ('wave') {
          <path
            class="outline"
            d="M5 37c14-23 27 23 44 0s29 23 46 0M5 64c14-23 27 23 44 0s29 23 46 0"
          />
        }
        @case ('arrow') {
          <path class="outline" d="M10 75c28-4 45-21 64-48M55 21l24 1-4 24" />
        }
        @case ('leaf') {
          <path d="M86 13C48 15 17 34 16 64c0 17 14 25 28 19 27-11 36-42 42-70Z" />
          <path class="cut" d="M25 75c17-20 31-31 50-48" />
        }
        @case ('cloud') {
          <path d="M24 78h56c23 0 24-34 2-37C78 17 43 15 35 39 9 35 3 72 24 78Z" />
        }
        @case ('drop') {
          <path d="M50 7S19 44 19 65a31 31 0 0 0 62 0C81 44 50 7 50 7Z" />
        }
        @case ('compass') {
          <circle class="outline" cx="50" cy="50" r="40" />
          <path d="m63 27-8 28-28 8 18-18Z" />
        }
        @case ('suitcase') {
          <rect x="13" y="29" width="74" height="58" rx="14" />
          <path class="outline" d="M37 29v-9h26v9M31 29v58M69 29v58" />
        }
        @case ('camera') {
          <rect x="9" y="27" width="82" height="59" rx="13" />
          <circle class="cut" cx="50" cy="57" r="17" />
          <path class="outline" d="m33 27 7-12h20l7 12" />
        }
      }
    </svg>
  `,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardStickerIconComponent {
  readonly motif = input.required<StickerMotif>();
}
