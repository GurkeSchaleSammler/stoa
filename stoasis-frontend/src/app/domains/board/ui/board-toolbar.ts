import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BoardViewMode } from '../../../shared/models/board-view-mode';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardContext } from '../data/models/board-context';

@Component({
  selector: 'ui-board-toolbar',
  standalone: true,
  imports: [AppIconComponent, TranslatePipe],
  template: `
    @if (context(); as active) {
      <header class="board-toolbar">
        <div class="board-heading">
          <span class="board-emoji">{{ active.emoji }}</span>
          <div>
            <p>{{ 'board.title' | translate }}</p>
            <h1>{{ active.name }}</h1>
          </div>
          <span class="member-count">
            {{ 'membership.personCount' | translate: { count: active.members.length } }}
          </span>
          @if (active.members.length) {
            <span
              class="member-avatars"
              [attr.aria-label]="
                'membership.memberCount' | translate: { count: active.members.length }
              "
            >
              @for (member of active.members.slice(0, 4); track member.userId) {
                <span [attr.title]="member.name">
                  @if (member.avatarUrl) {
                    <img [src]="member.avatarUrl" alt="" loading="lazy" decoding="async" />
                  } @else {
                    {{ member.name.slice(0, 1) }}
                  }
                </span>
              }
            </span>
          }
        </div>
        <div class="board-actions">
          <div class="view-toggle" role="group" [attr.aria-label]="'board.view' | translate">
            <button
              type="button"
              [class.active]="viewMode() === 'board'"
              (click)="viewModeChange.emit('board')"
              [attr.aria-label]="'board.boardView' | translate"
            >
              <ui-app-icon name="grid" />
            </button>
            <button
              type="button"
              [class.active]="viewMode() === 'list'"
              (click)="viewModeChange.emit('list')"
              [attr.aria-label]="'board.listView' | translate"
            >
              <ui-app-icon name="list" />
            </button>
          </div>
          <button type="button" class="toolbar-button" (click)="membersClick.emit()">
            <ui-app-icon name="user-plus" /> {{ 'common.person' | translate }}
          </button>
          @if (canEdit()) {
            <button
              type="button"
              class="toolbar-button decorate-button"
              [class.active]="paletteOpen()"
              (click)="paletteToggle.emit()"
            >
              <ui-app-icon name="sparkles" /> {{ 'board.decorate' | translate }}
            </button>
            <button
              type="button"
              class="toolbar-icon"
              [attr.aria-label]="'common.settings' | translate"
              (click)="settingsClick.emit()"
            >
              <ui-app-icon name="settings" />
            </button>
          }
        </div>
      </header>
    }
  `,
  host: { style: 'display: contents' },
  styles: `
    .member-avatars {
      display: flex;
      align-items: center;
      padding-left: 8px;
    }
    .member-avatars span {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      margin-left: -8px;
      overflow: hidden;
      border: 2px solid var(--surface-raised);
      border-radius: 50%;
      background: var(--sage-soft);
      color: var(--sage);
      font-size: 0.64rem;
      font-weight: 800;
    }
    .member-avatars img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardToolbarComponent {
  readonly context = input<BoardContext | null>(null);
  readonly viewMode = input<BoardViewMode>('board');
  readonly canEdit = input(false);
  readonly paletteOpen = input(false);
  readonly viewModeChange = output<BoardViewMode>();
  readonly membersClick = output<void>();
  readonly settingsClick = output<void>();
  readonly paletteToggle = output<void>();
}
