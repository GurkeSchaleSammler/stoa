import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent, AppIconName } from '../../../shared/ui/app-icon';
import {
  AddPinDraft,
  BoardContext,
  BoardViewMode,
  LinkPinData,
  LinkPreview,
  NotePinData,
  PhotoPinData,
  Pin,
  PinEditValue,
  PinMeta,
  PinType,
} from '../data/models/board.models';

@Component({
  selector: 'ui-link-pin',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <div class="link-visual">
      @if (data().imageUrl) {
        <img [src]="data().imageUrl" alt="" />
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

@Component({
  selector: 'ui-note-pin',
  standalone: true,
  template: `<div class="note-visual" [class]="'note-visual ' + data().color">
    <p>{{ data().content }}</p>
  </div>`,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotePinComponent {
  readonly data = input.required<NotePinData>();
  readonly meta = input.required<PinMeta>();
}

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

@Component({
  selector: 'ui-pin-card',
  standalone: true,
  imports: [LinkPinComponent, NotePinComponent, PhotoPinComponent, AppIconComponent],
  template: `
    <button
      type="button"
      class="pin-card"
      [class.selected]="selected()"
      (click)="onOpen.emit(pin().id)"
    >
      <span class="pin-type" [class]="'pin-type ' + pin().type">
        <ui-app-icon
          [name]="pin().type === 'link' ? 'link' : pin().type === 'note' ? 'note' : 'image'"
        />
      </span>
      @switch (pin().type) {
        @case ('link') {
          <ui-link-pin [data]="linkData()!" [meta]="meta()" />
        }
        @case ('note') {
          <ui-note-pin [data]="noteData()!" [meta]="meta()" />
        }
        @case ('photo') {
          <ui-photo-pin [data]="photoData()!" [meta]="meta()" />
        }
      }
      <footer class="pin-footer">
        <span>{{ pin().createdByName }}</span
        ><time [attr.datetime]="pin().createdAt">{{ pin().createdAt.slice(0, 10) }}</time>
      </footer>
    </button>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinCardComponent {
  readonly pin = input.required<Pin>();
  readonly selected = input(false);
  readonly onOpen = output<string>();
  readonly meta = computed<PinMeta>(() => ({
    createdByName: this.pin().createdByName,
    createdAt: this.pin().createdAt,
  }));
  readonly linkData = computed(() =>
    this.pin().type === 'link' ? (this.pin().data as LinkPinData) : null,
  );
  readonly noteData = computed(() =>
    this.pin().type === 'note' ? (this.pin().data as NotePinData) : null,
  );
  readonly photoData = computed(() =>
    this.pin().type === 'photo' ? (this.pin().data as PhotoPinData) : null,
  );
}

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

@Component({
  selector: 'ui-board-canvas',
  standalone: true,
  imports: [PinCardComponent, BoardListViewComponent, TranslatePipe, AppIconComponent],
  template: `
    <section class="board-shell">
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
          </div>
          <div class="board-actions">
            <div class="view-toggle" role="group" [attr.aria-label]="'board.view' | translate">
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
            <button type="button" class="toolbar-button" (click)="onMembersClick.emit()">
              <ui-app-icon name="user-plus" /> {{ 'common.person' | translate }}
            </button>
            @if (canEdit()) {
              <button
                type="button"
                class="toolbar-icon"
                [attr.aria-label]="'common.settings' | translate"
                (click)="onSettingsClick.emit()"
              >
                <ui-app-icon name="settings" />
              </button>
            }
          </div>
        </header>
        <div class="board-hint">
          {{ 'board.allowed' | translate }}:
          @for (type of active.allowedTypes; track type; let last = $last) {
            {{ 'pin.type.' + type | translate }}{{ last ? '' : ', ' }}
          }
          · {{ 'board.yourRole' | translate }}:
          {{ 'role.' + (active.currentUserRole || 'guest') | translate }}
        </div>
      }

      @if (error()) {
        <div class="board-error" role="alert">{{ error() | translate }}</div>
      }
      @if (isLoading()) {
        <div class="board-loading" [attr.aria-label]="'board.loading' | translate">
          <span></span><span></span><span></span>
        </div>
      } @else {
        <div class="board-canvas">
          @if (viewMode() === 'board') {
            <div class="pin-grid">
              @for (pin of pins(); track pin.id) {
                <ui-pin-card
                  [pin]="pin"
                  [selected]="selectedPinId() === pin.id"
                  (onOpen)="onSelectPin.emit($event)"
                />
              }
              @if (canEdit()) {
                <button type="button" class="add-pin-card" (click)="onAddPinClick.emit()">
                  <span aria-hidden="true"><ui-app-icon name="plus" /></span
                  ><strong>{{ 'pin.add' | translate }}</strong
                  ><small>{{ 'pin.addTypes' | translate }}</small>
                </button>
              }
            </div>
          } @else {
            <ui-board-list-view [pins]="pins()" (onSelectPin)="onSelectPin.emit($event)" />
          }
          @if (pins().length === 0 && !canEdit()) {
            <p class="empty-board">{{ 'board.empty' | translate }}</p>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardCanvasComponent {
  readonly pins = input.required<Pin[]>();
  readonly context = input<BoardContext | null>(null);
  readonly viewMode = input<BoardViewMode>('board');
  readonly selectedPinId = input<string | null>(null);
  readonly canEdit = input(false);
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly onSelectPin = output<string>();
  readonly onAddPinClick = output<void>();
  readonly onReorder = output<{ pinId: string; newOrder: number }>();
  readonly onViewModeChange = output<BoardViewMode>();
  readonly onMembersClick = output<void>();
  readonly onSettingsClick = output<void>();
}

@Component({
  selector: 'ui-add-pin-dialog',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    @if (isOpen()) {
      <div class="dialog-backdrop" (click)="onCancel.emit()">
        <section
          class="dialog-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-pin-title"
          (click)="$event.stopPropagation()"
        >
          <header>
            <div>
              <p class="eyebrow">{{ 'pin.new' | translate }}</p>
              <h1 id="add-pin-title">{{ 'pin.addTitle' | translate }}</h1>
            </div>
            <button
              type="button"
              class="close-button"
              [attr.aria-label]="'common.close' | translate"
              (click)="onCancel.emit()"
            >
              <ui-app-icon name="close" />
            </button>
          </header>
          @if (error()) {
            <p class="dialog-error" role="alert">{{ error() | translate }}</p>
          }
          <div class="pin-type-picker">
            @for (type of typeOptions; track type.value) {
              @if (allowedTypes().includes(type.value)) {
                <button
                  type="button"
                  [class.active]="selectedType() === type.value"
                  (click)="onTypeSelect.emit(type.value)"
                >
                  <span><ui-app-icon [name]="type.icon" /></span
                  ><strong>{{ type.labelKey | translate }}</strong>
                </button>
              }
            }
          </div>
          @switch (selectedType()) {
            @case ('link') {
              <label class="dialog-field"
                ><span>{{ 'pin.address' | translate }}</span
                ><input
                  type="url"
                  placeholder="https://…"
                  [ngModel]="draft().url"
                  (ngModelChange)="onDraftChange.emit({ url: $event })"
                  (blur)="onUrlChange.emit(draft().url)"
              /></label>
              @if (isParsing()) {
                <p class="helper">{{ 'pin.loadingPreview' | translate }}</p>
              }
              @if (preview(); as link) {
                <div class="link-preview">
                  <ui-app-icon name="link" />
                  <div>
                    <strong>{{ link.title }}</strong
                    ><small>{{ link.siteName || link.url }}</small>
                  </div>
                </div>
              }
            }
            @case ('note') {
              <label class="dialog-field"
                ><span>{{ 'pin.note' | translate }}</span
                ><textarea
                  rows="7"
                  [placeholder]="'pin.notePlaceholder' | translate"
                  [ngModel]="draft().content"
                  (ngModelChange)="onDraftChange.emit({ content: $event })"
                ></textarea>
              </label>
              <div class="color-picker" [attr.aria-label]="'pin.noteColor' | translate">
                @for (color of colors; track color) {
                  <button
                    type="button"
                    [class]="color"
                    [class.active]="draft().color === color"
                    (click)="onDraftChange.emit({ color })"
                    [attr.aria-label]="
                      'pin.colorLabel' | translate: { color: 'pin.colors.' + color | translate }
                    "
                  ></button>
                }
              </div>
            }
            @case ('photo') {
              <label class="file-drop"
                ><input type="file" accept="image/*" (change)="selectFile($event)" />
                <span><ui-app-icon name="upload" /></span
                ><strong>{{ 'pin.choosePhoto' | translate }}</strong
                ><small>{{ 'pin.photoFormats' | translate }}</small></label
              >
              @if (isUploading()) {
                <div class="progress"><span [style.width.%]="uploadProgress()"></span></div>
                <p class="helper">
                  {{ 'pin.uploadProgress' | translate: { progress: uploadProgress() } }}
                </p>
              }
              @if (uploadedFileName()) {
                <p class="file-name"><ui-app-icon name="check" /> {{ uploadedFileName() }}</p>
              }
              <label class="dialog-field"
                ><span>{{ 'pin.caption' | translate }}</span
                ><input
                  [ngModel]="draft().caption"
                  (ngModelChange)="onDraftChange.emit({ caption: $event })"
              /></label>
            }
          }
          @if (selectedType()) {
            <label class="dialog-field"
              ><span
                >{{ 'common.tags' | translate }}
                <small>({{ 'pin.separateWithComma' | translate }})</small></span
              ><input
                [placeholder]="'pin.tagsPlaceholder' | translate"
                [ngModel]="draft().tags"
                (ngModelChange)="onDraftChange.emit({ tags: $event })"
            /></label>
          }
          <footer>
            <button type="button" class="button secondary" (click)="onCancel.emit()">
              {{ 'common.cancel' | translate }}</button
            ><button
              type="button"
              class="button primary"
              [disabled]="!canSubmit() || isUploading()"
              (click)="onSubmit.emit()"
            >
              {{ 'pin.add' | translate }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPinDialogComponent {
  readonly isOpen = input(false);
  readonly allowedTypes = input.required<PinType[]>();
  readonly selectedType = input<PinType | null>(null);
  readonly draft = input.required<AddPinDraft>();
  readonly preview = input<LinkPreview | null>(null);
  readonly canSubmit = input(false);
  readonly isUploading = input(false);
  readonly isParsing = input(false);
  readonly uploadProgress = input(0);
  readonly uploadedFileName = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly onTypeSelect = output<PinType>();
  readonly onUrlChange = output<string>();
  readonly onFileSelect = output<File>();
  readonly onDraftChange = output<Partial<AddPinDraft>>();
  readonly onSubmit = output<void>();
  readonly onCancel = output<void>();
  readonly typeOptions: { value: PinType; labelKey: string; icon: AppIconName }[] = [
    { value: 'link', labelKey: 'pin.link', icon: 'link' },
    { value: 'note', labelKey: 'pin.note', icon: 'note' },
    { value: 'photo', labelKey: 'pin.photo', icon: 'image' },
  ];
  readonly colors: NotePinData['color'][] = ['yellow', 'blue', 'green'];
  selectFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.onFileSelect.emit(file);
  }
}

@Component({
  selector: 'ui-pin-detail',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    @if (pin(); as item) {
      <div class="detail-backdrop" (click)="onClose.emit()">
        <aside
          class="detail-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-detail-title"
          (click)="$event.stopPropagation()"
        >
          <header>
            <span class="detail-type">{{ 'pin.type.' + item.type | translate }}</span
            ><button
              type="button"
              class="close-button"
              [attr.aria-label]="'common.close' | translate"
              (click)="onClose.emit()"
            >
              <ui-app-icon name="close" />
            </button>
          </header>
          <div class="detail-content">
            @if (editMode()) {
              @switch (item.type) {
                @case ('link') {
                  <label class="dialog-field"
                    ><span>{{ 'common.title' | translate }}</span
                    ><input
                      [ngModel]="editValue().title"
                      (ngModelChange)="onDraftChange.emit({ title: $event })"
                  /></label>
                  <label class="dialog-field"
                    ><span>{{ 'common.description' | translate }}</span
                    ><textarea
                      rows="4"
                      [ngModel]="editValue().description"
                      (ngModelChange)="onDraftChange.emit({ description: $event })"
                    ></textarea>
                  </label>
                }
                @case ('note') {
                  <label class="dialog-field"
                    ><span>{{ 'pin.note' | translate }}</span
                    ><textarea
                      rows="10"
                      [ngModel]="editValue().content"
                      (ngModelChange)="onDraftChange.emit({ content: $event })"
                    ></textarea>
                  </label>
                }
                @case ('photo') {
                  <label class="dialog-field"
                    ><span>{{ 'pin.caption' | translate }}</span
                    ><input
                      [ngModel]="editValue().caption"
                      (ngModelChange)="onDraftChange.emit({ caption: $event })"
                  /></label>
                }
              }
              <label class="dialog-field"
                ><span>{{ 'common.tags' | translate }}</span
                ><input
                  [ngModel]="editValue().tags"
                  (ngModelChange)="onDraftChange.emit({ tags: $event })"
              /></label>
              <div class="detail-actions">
                <button type="button" class="button secondary" (click)="onCancelEdit.emit()">
                  {{ 'common.cancel' | translate }}</button
                ><button type="button" class="button primary" (click)="onSave.emit()">
                  {{ 'common.save' | translate }}
                </button>
              </div>
            } @else {
              @switch (item.type) {
                @case ('link') {
                  <p class="eyebrow">{{ item.data.siteName || ('pin.webLink' | translate) }}</p>
                  <h1 id="pin-detail-title">{{ item.data.title }}</h1>
                  <p class="detail-lead">{{ item.data.description }}</p>
                  <a class="visit-link" [href]="item.data.url" target="_blank" rel="noopener"
                    >{{ 'pin.openLink' | translate }} <ui-app-icon name="external"
                  /></a>
                }
                @case ('note') {
                  <p class="eyebrow">{{ 'pin.note' | translate }}</p>
                  <h1 id="pin-detail-title">{{ item.data.content }}</h1>
                }
                @case ('photo') {
                  <div class="detail-photo"><ui-app-icon name="image" /></div>
                  <h1 id="pin-detail-title">
                    {{ item.data.caption || ('pin.photo' | translate) }}
                  </h1>
                }
              }
              @if (item.tags.length) {
                <div class="tag-row">
                  @for (tag of item.tags; track tag) {
                    <span>#{{ tag }}</span>
                  }
                </div>
              }
              <p class="detail-meta">
                {{ 'pin.pinnedBy' | translate: { name: item.createdByName } }} ·
                {{ item.createdAt.slice(0, 10) }}
              </p>
              @if (canEdit()) {
                <div class="detail-actions">
                  <button type="button" class="button danger-ghost" (click)="onDelete.emit()">
                    <ui-app-icon name="trash" /> {{ 'common.delete' | translate }}</button
                  ><button type="button" class="button secondary" (click)="onEdit.emit()">
                    <ui-app-icon name="edit" /> {{ 'common.edit' | translate }}
                  </button>
                </div>
              }
            }

            <section class="comments" aria-labelledby="comments-title">
              <h2 id="comments-title">
                {{ 'pin.comments' | translate }} <span>{{ item.comments.length }}</span>
              </h2>
              @for (comment of item.comments; track comment.at + comment.authorId) {
                <article [class.pending]="comment.pending">
                  <strong>{{ comment.authorName | translate }}</strong>
                  <p>{{ comment.body }}</p>
                  <time>{{ comment.at.slice(0, 10) }}</time>
                </article>
              } @empty {
                <p class="helper">{{ 'pin.noComments' | translate }}</p>
              }
              <div class="comment-form">
                <label class="sr-only" for="new-comment">{{ 'pin.comment' | translate }}</label
                ><textarea
                  id="new-comment"
                  rows="2"
                  [placeholder]="'pin.replyPlaceholder' | translate"
                  [(ngModel)]="commentDraft"
                ></textarea
                ><button type="button" [disabled]="!commentDraft.trim()" (click)="submitComment()">
                  <ui-app-icon name="send" /> {{ 'common.send' | translate }}
                </button>
              </div>
            </section>
          </div>
        </aside>
      </div>
    }
  `,
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinDetailComponent {
  readonly pin = input<Pin | null>(null);
  readonly canEdit = input(false);
  readonly editMode = input(false);
  readonly editValue = input.required<PinEditValue>();
  readonly onEdit = output<void>();
  readonly onDraftChange = output<Partial<PinEditValue>>();
  readonly onSave = output<void>();
  readonly onCancelEdit = output<void>();
  readonly onDelete = output<void>();
  readonly onCommentSubmit = output<string>();
  readonly onClose = output<void>();
  commentDraft = '';
  submitComment(): void {
    this.onCommentSubmit.emit(this.commentDraft);
    this.commentDraft = '';
  }
}
