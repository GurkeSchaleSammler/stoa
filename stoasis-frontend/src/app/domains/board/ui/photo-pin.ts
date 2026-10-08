import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
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
      @if (data().imageUrl && failedImageUrl() !== data().imageUrl) {
        <img
          [src]="data().imageUrl"
          [alt]="data().caption || ('pin.photoPin' | translate)"
          loading="lazy"
          decoding="async"
          (error)="failedImageUrl.set(data().imageUrl ?? null)"
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
        <div class="photo-placeholder" role="img" [attr.aria-label]="'pin.photoPin' | translate">
          <ui-app-icon name="image" />
          @if (failedImageUrl()) {
            <small>{{ 'pin.imageUnavailable' | translate }}</small>
          }
        </div>
      }
    </div>
    @if (data().caption) {
      <div class="pin-body">
        <h2>{{ data().caption }}</h2>
      </div>
    }
  `,
  styleUrls: ['./board.scss', './image-action-trigger.scss'],
  styles: `
    .photo-placeholder {
      display: grid;
      justify-items: center;
      gap: 10px;
      padding: 24px;
      text-align: center;
    }
    .photo-placeholder small {
      font-family: var(--font-sans);
      font-size: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoPinComponent {
  readonly data = input.required<PhotoPinData>();
  readonly meta = input.required<PinMeta>();
  readonly onFullView = output<ImageFullView>();
  readonly failedImageUrl = signal<string | null>(null);

  openFullView(event: Event): void {
    event.stopPropagation();
    const data = this.data();
    if (!data.imageUrl) return;
    this.onFullView.emit({ src: data.imageUrl, caption: data.caption });
  }
}
