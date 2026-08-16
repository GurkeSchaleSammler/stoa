import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { LinkPinData } from '../../../shared/models/link-pin-data';
import { NotePinData } from '../../../shared/models/note-pin-data';
import { PhotoPinData } from '../../../shared/models/photo-pin-data';
import { Pin } from '../../../shared/models/pin';
import { PinMeta } from '../data/models/pin-meta';
import { LinkPinComponent } from './link-pin';
import { NotePinComponent } from './note-pin';
import { PhotoPinComponent } from './photo-pin';

@Component({
  selector: 'ui-pin-card',
  standalone: true,
  imports: [LinkPinComponent, NotePinComponent, PhotoPinComponent, AppIconComponent],
  template: `
    <button
      type="button"
      class="pin-card"
      [class.selected]="selected()"
      (click)="onOpen.emit(pin().id)"
    >
      <span class="pin-type" [class]="'pin-type ' + pin().type">
        <ui-app-icon
          [name]="pin().type === 'link' ? 'link' : pin().type === 'note' ? 'note' : 'image'"
        />
      </span>
      @switch (pin().type) {
        @case ('link') {
          <ui-link-pin [data]="linkData()!" [meta]="meta()" />
        }
        @case ('note') {
          <ui-note-pin [data]="noteData()!" [meta]="meta()" />
        }
        @case ('photo') {
          <ui-photo-pin [data]="photoData()!" [meta]="meta()" />
        }
      }
      <footer class="pin-footer">
        <span>{{ pin().createdByName }}</span
        ><time [attr.datetime]="pin().createdAt">{{ pin().createdAt.slice(0, 10) }}</time>
      </footer>
    </button>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinCardComponent {
  readonly pin = input.required<Pin>();
  readonly selected = input(false);
  readonly onOpen = output<string>();
  readonly meta = computed<PinMeta>(() => ({
    createdByName: this.pin().createdByName,
    createdAt: this.pin().createdAt,
  }));
  readonly linkData = computed(() =>
    this.pin().type === 'link' ? (this.pin().data as LinkPinData) : null,
  );
  readonly noteData = computed(() =>
    this.pin().type === 'note' ? (this.pin().data as NotePinData) : null,
  );
  readonly photoData = computed(() =>
    this.pin().type === 'photo' ? (this.pin().data as PhotoPinData) : null,
  );
}
