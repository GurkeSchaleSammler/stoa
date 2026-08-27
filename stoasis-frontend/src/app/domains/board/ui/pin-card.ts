import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { LinkPinData } from '../../../shared/models/link-pin-data';
import { NotePinData } from '../../../shared/models/note-pin-data';
import { PhotoPinData } from '../../../shared/models/photo-pin-data';
import { Pin } from '../../../shared/models/pin';
import { PinMeta } from '../data/models/pin-meta';
import { boardColorCssValue, normalizeBoardColor } from '../data/models/board-color';
import { ImageFullView } from './models/image-full-view';
import { LinkPinComponent } from './link-pin';
import { NotePinComponent } from './note-pin';
import { PhotoPinComponent } from './photo-pin';

@Component({
  selector: 'ui-pin-card',
  standalone: true,
  imports: [LinkPinComponent, NotePinComponent, PhotoPinComponent, AppIconComponent],
  template: `
    <article
      class="pin-card"
      role="button"
      tabindex="0"
      [class.selected]="selected()"
      [class.has-pin-color]="pinColor()"
      [attr.aria-pressed]="selected()"
      [style.--pin-color]="pinColorCssValue()"
      (click)="onOpen.emit(pin().id)"
      (keydown.enter)="openFromKeyboard($event)"
      (keydown.space)="openFromKeyboard($event)"
    >
      <span class="pin-type" [class]="'pin-type ' + pin().type">
        <ui-app-icon
          [name]="pin().type === 'link' ? 'link' : pin().type === 'note' ? 'note' : 'image'"
        />
      </span>
      @switch (pin().type) {
        @case ('link') {
          <ui-link-pin
            [data]="linkData()!"
            [meta]="meta()"
            (onFullView)="onImageFullView.emit($event)"
          />
        }
        @case ('note') {
          <ui-note-pin [data]="noteData()!" [meta]="meta()" />
        }
        @case ('photo') {
          <ui-photo-pin
            [data]="photoData()!"
            [meta]="meta()"
            (onFullView)="onImageFullView.emit($event)"
          />
        }
      }
      <footer class="pin-footer">
        <span>{{ pin().createdByName }}</span
        ><time [attr.datetime]="pin().createdAt">{{ pin().createdAt.slice(0, 10) }}</time>
      </footer>
    </article>
  `,
  styleUrls: ['./board.scss', './pin-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinCardComponent {
  readonly pin = input.required<Pin>();
  readonly selected = input(false);
  readonly onOpen = output<string>();
  readonly onImageFullView = output<ImageFullView>();
  readonly pinColor = computed(() => normalizeBoardColor(this.pin().color));
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

  pinColorCssValue(): string | null {
    return this.pinColor() ? boardColorCssValue(this.pinColor()) : null;
  }

  openFromKeyboard(event: Event): void {
    event.preventDefault();
    this.onOpen.emit(this.pin().id);
  }
}
