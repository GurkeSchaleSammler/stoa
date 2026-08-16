import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardViewMode } from '../../../shared/models/board-view-mode';
import { CollectionDetail } from '../data/models/collection-detail';

@Component({
  selector: 'ui-collection-toolbar',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    @if (collection(); as item) {
      <header class="collection-toolbar">
        <div class="toolbar-title">
          <span>{{ item.emoji }}</span>
          <h1>{{ item.name }}</h1>
        </div>
        <div class="toolbar-actions">
          <div class="segmented">
            <button
              type="button"
              [class.active]="viewMode() === 'board'"
              (click)="onViewModeChange.emit('board')"
              [attr.aria-label]="'board.boardView' | translate"
            >
              <ui-app-icon name="grid" />
            </button>
            <button
              type="button"
              [class.active]="viewMode() === 'list'"
              (click)="onViewModeChange.emit('list')"
              [attr.aria-label]="'board.listView' | translate"
            >
              <ui-app-icon name="list" />
            </button>
          </div>
          <button type="button" class="button secondary compact" (click)="onInviteClick.emit()">
            <ui-app-icon name="user-plus" /> {{ 'common.person' | translate }}
          </button>
          @if (canEdit()) {
            <button
              type="button"
              class="icon-button"
              (click)="onSettingsClick.emit()"
              [attr.aria-label]="'collection.settings' | translate"
            >
              <ui-app-icon name="settings" />
            </button>
          }
        </div>
      </header>
    }
  `,
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionToolbarComponent {
  readonly collection = input<CollectionDetail | null>(null);
  readonly viewMode = input<BoardViewMode>('board');
  readonly canEdit = input(false);
  readonly onViewModeChange = output<BoardViewMode>();
  readonly onInviteClick = output<void>();
  readonly onSettingsClick = output<void>();
}
