import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Pin } from '../../../shared/models/pin';
import { DateDraft, PinDate, orderedTimeline, pinTitle } from '../data/models/board-experience';

@Component({
  selector: 'ui-board-timeline-view',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './board-timeline-view.html',
  styleUrl: './board-experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardTimelineViewComponent {
  readonly pins = input.required<Pin[]>();
  readonly dates = input.required<PinDate[]>();
  readonly canEdit = input(false);
  readonly saving = input(false);
  readonly pinSelected = output<string>();
  readonly dateSaved = output<DateDraft>();
  readonly editing = signal<string | null>(null);
  readonly start = signal('');
  readonly end = signal('');
  readonly title = pinTitle;
  readonly entries = computed(() => orderedTimeline(this.pins(), this.dates()));
  readonly dated = computed(() => this.entries().filter((entry) => entry.date));
  readonly undated = computed(() => this.entries().filter((entry) => !entry.date));
  readonly invalid = computed(() => !this.start() || (!!this.end() && this.end() < this.start()));
  edit(pinId: string) {
    const date = this.dates().find((date) => date.pinId === pinId);
    this.start.set(date?.startDate ?? '');
    this.end.set(date?.endDate ?? '');
    this.editing.set(pinId);
  }
  save() {
    if (!this.invalid())
      this.dateSaved.emit({
        pinId: this.editing()!,
        startDate: this.start(),
        endDate: this.end() || null,
      });
  }
  clear() {
    this.dateSaved.emit({ pinId: this.editing()!, startDate: null, endDate: null });
  }
}
