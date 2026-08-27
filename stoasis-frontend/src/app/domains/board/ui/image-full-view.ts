import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { ImageFullView } from './models/image-full-view';

@Component({
  selector: 'ui-image-full-view',
  standalone: true,
  imports: [AppIconComponent, TranslatePipe],
  template: `
    <div
      class="image-fullview"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="'pin.imageFullView' | translate"
      (click)="close.emit()"
    >
      <button
        type="button"
        class="image-fullview-close"
        [attr.aria-label]="'common.close' | translate"
        (click)="$event.stopPropagation(); close.emit()"
      >
        <ui-app-icon name="close" />
      </button>
      <figure class="image-fullview-frame" (click)="$event.stopPropagation()">
        <img [src]="image().src" [alt]="image().caption || ('pin.imagePreview' | translate)" />
        @if (image().caption) {
          <figcaption>{{ image().caption }}</figcaption>
        }
      </figure>
    </div>
  `,
  styleUrl: './image-full-view.scss',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageFullViewComponent {
  readonly image = input.required<ImageFullView>();
  readonly close = output<void>();
}
