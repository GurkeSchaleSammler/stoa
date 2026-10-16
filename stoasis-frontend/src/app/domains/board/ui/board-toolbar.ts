import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { BoardViewMode } from '../../../shared/models/board-view-mode';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardContext } from '../data/models/board-context';
import { ViewportService } from '../../../shared/application/viewport.service';

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
          @if (canEdit()) {
            <button
              type="button"
              class="toolbar-button add-pin-button"
              (click)="addPinClick.emit()"
            >
              <ui-app-icon name="plus" /> {{ 'pin.add' | translate }}
            </button>
          }
          <div class="view-toggle" role="group" [attr.aria-label]="'board.view' | translate">
            <button
              type="button"
              [class.active]="viewMode() === 'board'"
              [attr.aria-pressed]="viewMode() === 'board'"
              (click)="viewModeChange.emit('board')"
              [attr.aria-label]="'board.boardView' | translate"
            >
              <ui-app-icon name="grid" />
            </button>
            <button
              type="button"
              [class.active]="viewMode() === 'list'"
              [attr.aria-pressed]="viewMode() === 'list'"
              (click)="viewModeChange.emit('list')"
              [attr.aria-label]="'board.listView' | translate"
            >
              <ui-app-icon name="list" />
            </button>
            @for (mode of extraViews; track mode) {
              <button
                type="button"
                [class.active]="viewMode() === mode"
                [attr.aria-pressed]="viewMode() === mode"
                (click)="viewModeChange.emit(mode)"
                [attr.title]="'board.experience.' + mode | translate"
                [attr.aria-label]="'board.experience.' + mode | translate"
              >
                <ui-app-icon
                  [name]="
                    mode === 'network' ? 'network' : mode === 'timeline' ? 'timeline' : 'play'
                  "
                />
              </button>
            }
          </div>
          <details #toolsMenu class="board-tool-menu" [open]="!viewport.compact()">
            <summary [attr.aria-label]="'shell.boardTools' | translate">
              <ui-app-icon name="more" />
            </summary>
            <div class="board-tool-options">
              <button
                type="button"
                class="toolbar-button"
                (click)="closeTools(); membersClick.emit()"
              >
                <ui-app-icon name="user-plus" /> {{ 'common.person' | translate }}
              </button>
              @if (canEdit()) {
                <button
                  type="button"
                  class="toolbar-button decorate-button"
                  [class.active]="paletteOpen()"
                  [attr.aria-pressed]="paletteOpen()"
                  [attr.aria-label]="'board.decorate' | translate"
                  (click)="closeTools(); paletteToggle.emit()"
                >
                  <ui-app-icon name="palette" /> {{ 'board.decorate' | translate }}
                </button>
                <button
                  type="button"
                  class="toolbar-icon"
                  [attr.aria-label]="'board.console' | translate"
                  [attr.title]="'board.console' | translate"
                  (click)="closeTools(); consoleClick.emit()"
                >
                  <ui-app-icon name="terminal" />
                  <span class="mobile-tool-label">{{ 'board.console' | translate }}</span>
                </button>
                <button
                  type="button"
                  class="toolbar-icon"
                  [attr.aria-label]="'common.settings' | translate"
                  (click)="closeTools(); settingsClick.emit()"
                >
                  <ui-app-icon name="settings" />
                  <span class="mobile-tool-label">{{ 'common.settings' | translate }}</span>
                </button>
              }
            </div>
          </details>
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
  readonly extraViews = ['network', 'timeline', 'presentation'] as const;
  protected readonly viewport = inject(ViewportService);
  private readonly toolsMenu = viewChild<ElementRef<HTMLDetailsElement>>('toolsMenu');
  readonly context = input<BoardContext | null>(null);
  readonly viewMode = input<BoardViewMode>('board');
  readonly canEdit = input(false);
  readonly paletteOpen = input(false);
  readonly viewModeChange = output<BoardViewMode>();
  readonly membersClick = output<void>();
  readonly consoleClick = output<void>();
  readonly settingsClick = output<void>();
  readonly paletteToggle = output<void>();
  readonly addPinClick = output<void>();

  protected closeTools(): void {
    const menu = this.toolsMenu()?.nativeElement;
    if (menu?.open && this.viewport.compact()) {
      if (menu.contains(document.activeElement)) menu.querySelector('summary')?.focus();
      menu.open = false;
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    const menu = this.toolsMenu()?.nativeElement;
    if (menu?.open && this.viewport.compact()) {
      this.closeTools();
      menu.querySelector('summary')?.focus();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onOutsidePointer(event: PointerEvent): void {
    if (!this.toolsMenu()?.nativeElement.contains(event.target as Node)) this.closeTools();
  }
}
