import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { Pin } from '../../../shared/models/pin';
import { NOTE_BACKGROUND_PRESETS } from '../data/models/board-color';
import { PinEditValue } from '../data/models/pin-edit-value';
import { BoardColorPickerComponent } from './board-color-picker';
import { ImageFullViewComponent } from './image-full-view';
import { ImageFullView } from './models/image-full-view';

@Component({
  selector: 'ui-pin-detail',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    AppIconComponent,
    BoardColorPickerComponent,
    ImageFullViewComponent,
  ],
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
            @if (canCopy() && !editMode()) {
              <button type="button" class="button secondary" (click)="copyRequested.emit()">
                <ui-app-icon name="copy" />{{ 'templates.copyPin' | translate }}
              </button>
              @if (canEdit()) {
                <button
                  type="button"
                  class="button secondary"
                  [disabled]="isMutating()"
                  (click)="duplicateRequested.emit()"
                >
                  <ui-app-icon name="layers" />{{ 'templates.duplicatePin' | translate }}
                </button>
              }
            }
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
              @if (item.type === 'note') {
                <ui-board-color-picker
                  labelKey="pin.backgroundColor"
                  [value]="editValue().color"
                  [presetColors]="backgroundColors"
                  [allowCustom]="allowCustomColors()"
                  (valueChange)="onDraftChange.emit({ color: $event })"
                />
              }
              <ui-board-color-picker
                labelKey="pin.pinColor"
                [value]="editValue().pinColor"
                [allowClear]="true"
                [allowCustom]="allowCustomColors()"
                (valueChange)="onDraftChange.emit({ pinColor: $event })"
                (clear)="onDraftChange.emit({ pinColor: null })"
              />
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
                  @if (item.data.imageUrl) {
                    <button
                      type="button"
                      class="detail-image-preview"
                      [attr.aria-label]="'pin.openFullView' | translate"
                      (click)="openPinImage(item)"
                    >
                      <img
                        [src]="item.data.imageUrl"
                        [alt]="
                          item.data.title || item.data.siteName || ('pin.imagePreview' | translate)
                        "
                        loading="lazy"
                        decoding="async"
                        referrerpolicy="no-referrer"
                      />
                      <span class="detail-image-action"><ui-app-icon name="maximize" /></span>
                    </button>
                  }
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
                  @if (item.data.imageUrl) {
                    <button
                      type="button"
                      class="detail-photo has-image"
                      [attr.aria-label]="'pin.openFullView' | translate"
                      (click)="openPinImage(item)"
                    >
                      <img
                        [src]="item.data.imageUrl"
                        [alt]="item.data.caption || ('pin.photoPin' | translate)"
                        loading="lazy"
                        decoding="async"
                      />
                      <span class="detail-image-action"><ui-app-icon name="maximize" /></span>
                    </button>
                  } @else {
                    <div class="detail-photo"><ui-app-icon name="image" /></div>
                  }
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
                <span class="detail-author-avatar" aria-hidden="true">
                  @if (item.createdByAvatarUrl) {
                    <img [src]="item.createdByAvatarUrl" alt="" loading="lazy" decoding="async" />
                  } @else {
                    {{ item.createdByName.slice(0, 1) }}
                  }
                </span>
                <span>{{ 'pin.pinnedBy' | translate: { name: item.createdByName } }}</span>
                <span>{{ item.createdAt.slice(0, 10) }}</span>
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
                  <span class="comment-avatar" aria-hidden="true">
                    @if (comment.authorAvatarUrl) {
                      <img [src]="comment.authorAvatarUrl" alt="" loading="lazy" decoding="async" />
                    } @else {
                      {{ (comment.authorName | translate).slice(0, 1) }}
                    }
                  </span>
                  <div>
                    <strong>{{ comment.authorName | translate }}</strong>
                    <p>{{ comment.body }}</p>
                    <time>{{ comment.at.slice(0, 10) }}</time>
                  </div>
                </article>
              } @empty {
                <p class="helper">{{ 'pin.noComments' | translate }}</p>
              }
              @if (canComment()) {
                <div class="comment-form">
                  <label class="sr-only" for="new-comment">{{ 'pin.comment' | translate }}</label
                  ><textarea
                    id="new-comment"
                    rows="2"
                    [placeholder]="'pin.replyPlaceholder' | translate"
                    [(ngModel)]="commentDraft"
                  ></textarea
                  ><button
                    type="button"
                    [disabled]="!commentDraft.trim()"
                    (click)="submitComment()"
                  >
                    <ui-app-icon name="send" /> {{ 'common.send' | translate }}
                  </button>
                </div>
              }
            </section>
          </div>
        </aside>
      </div>
    }
    @if (imageFullView(); as image) {
      <ui-image-full-view [image]="image" (close)="closeImageFullView()" />
    }
  `,
  styleUrls: ['./board.scss', './pin-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinDetailComponent {
  readonly pin = input<Pin | null>(null);
  readonly canEdit = input(false);
  readonly canCopy = input(false);
  readonly isMutating = input(false);
  readonly copyRequested = output<void>();
  readonly duplicateRequested = output<void>();
  readonly canComment = input(true);
  readonly editMode = input(false);
  readonly editValue = input.required<PinEditValue>();
  readonly allowCustomColors = input(false);
  readonly onEdit = output<void>();
  readonly onDraftChange = output<Partial<PinEditValue>>();
  readonly onSave = output<void>();
  readonly onCancelEdit = output<void>();
  readonly onDelete = output<void>();
  readonly onCommentSubmit = output<string>();
  readonly onClose = output<void>();
  readonly backgroundColors = NOTE_BACKGROUND_PRESETS;
  readonly imageFullView = signal<ImageFullView | null>(null);
  commentDraft = '';

  @HostListener('document:keydown.escape')
  closeImageFullViewFromKeyboard(): void {
    if (this.imageFullView()) this.closeImageFullView();
  }

  openPinImage(pin: Pin): void {
    if (pin.type === 'photo' && pin.data.imageUrl) {
      this.imageFullView.set({ src: pin.data.imageUrl, caption: pin.data.caption });
      return;
    }
    if (pin.type === 'link' && pin.data.imageUrl) {
      this.imageFullView.set({
        src: pin.data.imageUrl,
        caption: pin.data.title || pin.data.siteName || pin.data.url,
      });
    }
  }

  closeImageFullView(): void {
    this.imageFullView.set(null);
  }

  submitComment(): void {
    this.onCommentSubmit.emit(this.commentDraft);
    this.commentDraft = '';
  }
}
