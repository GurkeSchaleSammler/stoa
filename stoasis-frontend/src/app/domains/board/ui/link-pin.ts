import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { LinkPinData } from '../../../shared/models/link-pin-data';
import { PinMeta } from '../data/models/pin-meta';
import { ImageFullView } from './models/image-full-view';

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
  styleUrls: ['./board.scss', './image-action-trigger.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkPinComponent {
  readonly data = input.required<LinkPinData>();
  readonly meta = input.required<PinMeta>();
  readonly onFullView = output<ImageFullView>();

  openFullView(event: Event): void {
    event.stopPropagation();
    const data = this.data();
    if (!data.imageUrl) return;
    this.onFullView.emit({
      src: data.imageUrl,
      caption: data.title || data.siteName || data.url,
    });
  }
}
