import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Pin } from '../../../shared/models/pin';
import { PathDraft, PresentationPath, pinTitle } from '../data/models/board-experience';
import { BoardPresentationPlayerComponent } from './board-presentation-player';

@Component({
  selector: 'ui-board-presentations',
  standalone: true,
  imports: [TranslatePipe, BoardPresentationPlayerComponent],
  templateUrl: './board-presentations.html',
  styleUrl: './board-experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPresentationsComponent {
  readonly pins = input.required<Pin[]>();
  readonly paths = input.required<PresentationPath[]>();
  readonly limit = input<number | null>(7);
  readonly canEdit = input(false);
  readonly saving = input(false);
  readonly pathSaved = output<PathDraft>();
  readonly pathDeleted = output<string>();
  readonly draft = signal<PathDraft | null>(null);
  readonly playing = signal<PresentationPath | null>(null);
  readonly deleting = signal<string | null>(null);
  readonly title = pinTitle;
  readonly byId = computed(() => new Map(this.pins().map((pin) => [pin.id, pin])));
  readonly canCreate = computed(() => this.limit() === null || this.paths().length < this.limit()!);
  edit(path?: PresentationPath) {
    this.draft.set(path ? { ...path, pinIds: [...path.pinIds] } : { name: '', pinIds: [] });
  }
  name(value: string) {
    this.draft.update((d) => (d ? { ...d, name: value } : d));
  }
  add(id: string) {
    if (this.byId().has(id))
      this.draft.update((d) => (d ? { ...d, pinIds: [...d.pinIds, id] } : d));
  }
  remove(index: number) {
    this.draft.update((d) => (d ? { ...d, pinIds: d.pinIds.filter((_, i) => i !== index) } : d));
  }
  move(index: number, offset: number) {
    this.draft.update((d) => {
      if (!d || index + offset < 0 || index + offset >= d.pinIds.length) return d;
      const pinIds = [...d.pinIds];
      [pinIds[index], pinIds[index + offset]] = [pinIds[index + offset], pinIds[index]];
      return { ...d, pinIds };
    });
  }
  save() {
    const draft = this.draft();
    if (draft?.name.trim() && draft.pinIds.length && !this.saving()) this.pathSaved.emit(draft);
  }
}
