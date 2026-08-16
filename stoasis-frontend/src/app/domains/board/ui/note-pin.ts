import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NotePinData } from '../../../shared/models/note-pin-data';
import { PinMeta } from '../data/models/pin-meta';

@Component({
  selector: 'ui-note-pin',
  standalone: true,
  template: `<div class="note-visual" [class]="'note-visual ' + data().color">
    <p>{{ data().content }}</p>
  </div>`,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotePinComponent {
  readonly data = input.required<NotePinData>();
  readonly meta = input.required<PinMeta>();
}
