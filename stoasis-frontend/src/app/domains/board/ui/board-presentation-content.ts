import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Pin } from '../../../shared/models/pin';
import { MarkdownContentComponent } from '../../../shared/ui/markdown-content';
import { pinTitle } from '../data/models/board-experience';

@Component({
  selector: 'ui-board-presentation-content',
  standalone: true,
  imports: [TranslatePipe, MarkdownContentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let current = pin();
    <h2>{{ title(current) }}</h2>
    @switch (current.type) {
      @case ('note') {
        <ui-markdown-content [content]="current.data.content" />
      }
      @case ('link') {
        @if (current.data.imageUrl && !imageFailed()) {
          <img
            [src]="current.data.imageUrl"
            alt=""
            referrerpolicy="no-referrer"
            (error)="imageFailed.set(true)"
          />
        }
        <p>{{ current.data.description }}</p>
        <a [href]="current.data.url" target="_blank" rel="noopener noreferrer"
          >{{ 'pin.webLink' | translate }} ↗</a
        >
      }
      @case ('photo') {
        @if (current.data.imageUrl && !imageFailed()) {
          <img
            [src]="current.data.imageUrl"
            [alt]="current.data.caption || ('pin.photo' | translate)"
            (error)="imageFailed.set(true)"
          />
        } @else {
          <p>{{ 'pin.imageUnavailable' | translate }}</p>
        }
      }
      @case ('portal') {
        <p>{{ current.data.emoji }} {{ current.data.targetName }}</p>
      }
      @case ('skill') {
        <p>{{ current.data.level }}</p>
      }
    }
    <footer>{{ current.createdByName }}</footer>
  `,
  styles: `
    :host {
      display: block;
    }
    h2 {
      font:
        600 24px Georgia,
        serif;
      margin: 0 0 20px;
      overflow-wrap: anywhere;
    }
    img {
      display: block;
      width: 100%;
      max-height: 320px;
      object-fit: contain;
      border-radius: 7px;
    }
    p {
      line-height: 1.6;
    }
    a {
      color: var(--accent-strong);
    }
    footer {
      margin-top: 24px;
      color: var(--muted);
      font-size: 12px;
    }
  `,
})
export class BoardPresentationContentComponent {
  readonly pin = input.required<Pin>();
  readonly title = pinTitle;
  readonly imageFailed = signal(false);
}
