import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { PhotoPinData } from '../../../shared/models/photo-pin-data';
import { PinMeta } from '../data/models/pin-meta';
import { ImageFullView } from './models/image-full-view';

@Component({
  selector: 'ui-photo-pin',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="photo-visual">
      @if (data().imageUrl) {
        <img
          [src]="data().imageUrl"
          [alt]="data().caption || ('pin.photoPin' | translate)"
          loading="lazy"
          decoding="async"
        />
        <button
          type="button"
          class="image-fullview-trigger"
          [attr.aria-label]="'pin.openFullView' | translate"
          [attr.title]="'pin.openFullView' | translate"
          (pointerdown)="$event.stopPropagation()"
          (pointerup)="$event.stopPropagation()"
          (mousedown)="$event.stopPropagation()"
          (mouseup)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
          (click)="openFullView($event)"
        >
          <ui-app-icon name="maximize" />
        </button>
      } @else {
        <ui-app-icon name="image" />
      }
    </div>
    @if (data().caption) {
      <div class="pin-body">
        <h2>{{ data().caption }}</h2>
      </div>
    }
  `,
  styleUrls: ['./board.scss', './image-action-trigger.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoPinComponent {
  readonly data = input.required<PhotoPinData>();
  readonly meta = input.required<PinMeta>();
  readonly onFullView = output<ImageFullView>();

  openFullView(event: Event): void {
    event.stopPropagation();
    const data = this.data();
    if (!data.imageUrl) return;
    this.onFullView.emit({ src: data.imageUrl, caption: data.caption });
  }
}
