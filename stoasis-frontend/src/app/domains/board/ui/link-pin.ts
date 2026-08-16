import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { LinkPinData } from '../../../shared/models/link-pin-data';
import { PinMeta } from '../data/models/pin-meta';

@Component({
  selector: 'ui-link-pin',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="link-visual">
      @if (data().imageUrl) {
        <img
          [src]="data().imageUrl"
          alt=""
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      } @else {
        <ui-app-icon name="link" />
      }
    </div>
    <div class="pin-body">
      <p class="pin-kicker">
        {{ data().siteName || ('pin.webLink' | translate) }}
        @if (data().readingTimeMin) {
          · {{ 'pin.readingTime' | translate: { minutes: data().readingTimeMin } }}
        }
      </p>
      <h2>{{ data().title || data().url }}</h2>
      @if (data().description) {
        <p class="pin-description">{{ data().description }}</p>
      }
    </div>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkPinComponent {
  readonly data = input.required<LinkPinData>();
  readonly meta = input.required<PinMeta>();
}
