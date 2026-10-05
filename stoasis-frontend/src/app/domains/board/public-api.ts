import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Pin } from '../../shared/models/pin';
import { PinEditValue } from './data/models/pin-edit-value';
import { ImageFullViewComponent } from './ui/image-full-view';
import { ImageFullView } from './ui/models/image-full-view';
import { PinCardComponent } from './ui/pin-card';
import { PinDetailComponent } from './ui/pin-detail';

/** Public, read-only presentation surface for consumers outside the board domain. */
@Component({
  selector: 'ui-board-public-presentation',
  standalone: true,
  imports: [PinCardComponent, PinDetailComponent, ImageFullViewComponent],
  template: `
    @for (pin of pins(); track pin.id) {
      <ui-pin-card
        [pin]="pin"
        [selected]="selectedPin()?.id === pin.id"
        (onOpen)="selectPin($event)"
        (onImageFullView)="imageFullView.set($event)"
      />
    }
    @if (selectedPin(); as pin) {
      <ui-pin-detail
        [pin]="pin"
        [canEdit]="false"
        [canComment]="false"
        [editValue]="emptyEditValue"
        (onClose)="selectedPin.set(null)"
      />
    }
    @if (imageFullView(); as image) {
      <ui-image-full-view [image]="image" (close)="imageFullView.set(null)" />
    }
  `,
  styles: `
    :host {
      display: grid;
      width: min(1120px, calc(100% - 40px));
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      align-items: start;
      gap: 14px;
      margin: 0 auto;
      padding: 28px 0 72px;
    }
    ui-pin-card {
      min-width: 0;
    }
    @media (max-width: 620px) {
      :host {
        width: calc(100% - 28px);
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicBoardPresentationComponent {
  readonly pins = input.required<Pin[]>();
  readonly selectedPin = signal<Pin | null>(null);
  readonly imageFullView = signal<ImageFullView | null>(null);
  readonly emptyEditValue: PinEditValue = {
    title: '',
    description: '',
    content: '',
    color: '',
    pinColor: null,
    caption: '',
    tags: '',
  };

  selectPin(id: string): void {
    this.selectedPin.set(this.pins().find((pin) => pin.id === id) ?? null);
  }
}
