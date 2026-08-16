import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { Pin } from '../../../shared/models/pin';

@Component({
  selector: 'ui-board-list-view',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="list-view">
      @for (pin of pins(); track pin.id) {
        <button type="button" class="pin-row" (click)="onSelectPin.emit(pin.id)">
          <span class="row-type">
            <ui-app-icon
              [name]="pin.type === 'link' ? 'link' : pin.type === 'note' ? 'note' : 'image'"
            />
          </span>
          <span class="row-content">
            <strong>
              @switch (pin.type) {
                @case ('link') {
                  {{ pin.data.title }}
                }
                @case ('note') {
                  {{ pin.data.content }}
                }
                @case ('photo') {
                  {{ pin.data.caption || ('pin.photo' | translate) }}
                }
              }
            </strong>
            <small
              >{{ pin.createdByName }} ·
              {{ pin.tags.join(', ') || ('pin.withoutTags' | translate) }}</small
            >
          </span>
          <ui-app-icon name="chevron-right" />
        </button>
      }
    </div>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardListViewComponent {
  readonly pins = input.required<Pin[]>();
  readonly onSelectPin = output<string>();
}
