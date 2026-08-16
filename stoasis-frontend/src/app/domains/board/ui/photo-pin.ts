import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { PhotoPinData } from '../../../shared/models/photo-pin-data';
import { PinMeta } from '../data/models/pin-meta';

@Component({
  selector: 'ui-photo-pin',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="photo-visual">
      @if (data().imageUrl) {
        <img [src]="data().imageUrl" [alt]="data().caption || ('pin.photoPin' | translate)" />
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
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoPinComponent {
  readonly data = input.required<PhotoPinData>();
  readonly meta = input.required<PinMeta>();
}
