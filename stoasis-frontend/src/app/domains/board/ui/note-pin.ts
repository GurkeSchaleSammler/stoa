import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NotePinData } from '../../../shared/models/note-pin-data';
import { MarkdownContentComponent } from '../../../shared/ui/markdown-content';
import { PinMeta } from '../data/models/pin-meta';
import { boardColorCssValue, normalizeBoardColor } from '../data/models/board-color';

@Component({
  selector: 'ui-note-pin',
  standalone: true,
  imports: [MarkdownContentComponent],
  template: `<div
    class="note-visual"
    [class]="'note-visual ' + data().color"
    [style.--note-background]="backgroundColor()"
    [style.--note-foreground]="foregroundColor()"
  >
    @if (data().title) {
      <h2>{{ data().title }}</h2>
    }
    <ui-markdown-content [content]="data().content" />
  </div>`,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotePinComponent {
  readonly data = input.required<NotePinData>();
  readonly meta = input.required<PinMeta>();
  readonly backgroundColor = computed(() => noteBackgroundColor(this.data().color));
  readonly foregroundColor = computed(() => readableTextColor(this.data().color));
}

function noteBackgroundColor(color: string): string {
  const legacyColors: Record<string, string> = {
    yellow: '#fff5bd',
    blue: '#dceef7',
    green: '#dcebdc',
  };
  return legacyColors[color] ?? boardColorCssValue(color, 'white');
}

function readableTextColor(color: string): string {
  const legacyTextColors: Record<string, string> = {
    yellow: '#534817',
    blue: '#214759',
    green: '#23462b',
  };
  if (legacyTextColors[color]) return legacyTextColors[color];
  const normalized = normalizeBoardColor(color);
  if (normalized === 'black') return '#ffffff';
  if (normalized === 'white' || !normalized?.startsWith('#')) return '#171713';

  const hex = normalized.slice(1);
  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((value) => value + value)
          .join('')
      : hex;
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance < 142 ? '#ffffff' : '#171713';
}
