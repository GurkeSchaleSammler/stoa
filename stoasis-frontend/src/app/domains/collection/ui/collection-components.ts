import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardViewMode, PinType } from '../../../shared/models/core.models';
import {
  CollectionDetail,
  CollectionFilter,
  CollectionSummary,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from '../data/models/collection.models';

@Component({
  selector: 'ui-collection-list',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    <nav class="collection-sidebar" [attr.aria-label]="'collection.plural' | translate">
      <div class="sidebar-brand">
        <a class="brand" href="/" [attr.aria-label]="'shell.home' | translate"
          ><span><img src="/android-chrome-192x192.png" alt="" /></span> Stoasis</a
        >
        <a class="icon-button" href="/search" [attr.aria-label]="'home.searchPins' | translate"
          ><ui-app-icon name="search"
        /></a>
      </div>

      <div
        class="collection-tabs"
        role="tablist"
        [attr.aria-label]="'collection.filterLabel' | translate"
      >
        @for (tab of tabs; track tab.value) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="activeTab() === tab.value"
            [class.active]="activeTab() === tab.value"
            (click)="onTabChange.emit(tab.value)"
          >
            {{ tab.labelKey | translate }}
          </button>
        }
      </div>

      <label class="sidebar-search">
        <span class="sr-only">{{ 'collection.search' | translate }}</span>
        <ui-app-icon name="search" />
        <input
          type="search"
          [placeholder]="'collection.searchPlaceholder' | translate"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange.emit($event)"
        />
      </label>

      <div class="collection-list">
        @if (isLoading()) {
          @for (placeholder of placeholders; track placeholder) {
            <div class="collection-skeleton" aria-hidden="true"></div>
          }
        } @else if (collections().length === 0) {
          <p class="empty-copy">{{ 'collection.empty' | translate }}</p>
        } @else {
          @for (collection of collections(); track collection.id) {
            <button
              type="button"
              class="collection-item"
              [class.active]="activeId() === collection.id"
              (click)="onSelect.emit(collection.id)"
            >
              <span class="collection-emoji" aria-hidden="true">{{ collection.emoji }}</span>
              <span class="collection-copy">
                <strong>{{ collection.name }}</strong>
                <small>
                  <span class="visibility">{{
                    (collection.members.length > 1 ? 'collection.shared' : 'collection.personal')
                      | translate
                  }}</span>
                  {{ collection.pinCount }} {{ 'common.pins' | translate }}
                </small>
              </span>
              @if (collection.members.length > 1) {
                <span
                  class="avatar-stack"
                  [attr.aria-label]="
                    'membership.memberCount' | translate: { count: collection.members.length }
                  "
                >
                  @for (member of collection.members.slice(0, 3); track member.userId) {
                    <span>{{ member.name.slice(0, 1) }}</span>
                  }
                </span>
              }
            </button>
          }
        }
      </div>

      <button type="button" class="new-collection" (click)="onCreateClick.emit()">
        <ui-app-icon name="plus" /> <span>{{ 'collection.new' | translate }}</span>
      </button>
    </nav>
  `,
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionListComponent {
  readonly collections = input.required<CollectionSummary[]>();
  readonly activeTab = input<CollectionFilter>('all');
  readonly activeId = input<string | null>(null);
  readonly isLoading = input(false);
  readonly onTabChange = output<CollectionFilter>();
  readonly onSelect = output<string>();
  readonly onCreateClick = output<void>();
  readonly onQueryChange = output<string>();
  readonly tabs: { value: CollectionFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'common.all' },
    { value: 'personal', labelKey: 'collection.personal' },
    { value: 'shared', labelKey: 'collection.shared' },
  ];
  readonly placeholders = [1, 2, 3];
  query = '';
}

@Component({
  selector: 'ui-collection-create',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    <section class="panel-card create-card" aria-labelledby="create-title">
      <div class="eyebrow">{{ 'collection.newBoard' | translate }}</div>
      <h1 id="create-title">{{ 'collection.createTitle' | translate }}</h1>
      <p class="lead">{{ 'collection.createLead' | translate }}</p>
      @if (error()) {
        <p class="error-banner" role="alert">{{ error() | translate }}</p>
      }
      <div class="form-grid">
        <label class="emoji-field">
          <span>{{ 'common.emoji' | translate }}</span>
          <input type="text" maxlength="4" [(ngModel)]="emoji" (ngModelChange)="emitDraft()" />
        </label>
        <label>
          <span>{{ 'common.name' | translate }}</span>
          <input
            type="text"
            autofocus
            [placeholder]="'collection.namePlaceholder' | translate"
            [(ngModel)]="name"
            (ngModelChange)="emitDraft()"
          />
        </label>
      </div>
      <fieldset>
        <legend>{{ 'collection.allowedPinTypes' | translate }}</legend>
        <div class="type-picker">
          <label
            ><input type="checkbox" [(ngModel)]="link" (ngModelChange)="emitDraft()" />
            <span><ui-app-icon name="link" /></span
            ><strong>{{ 'pin.types.links' | translate }}</strong></label
          >
          <label
            ><input type="checkbox" [(ngModel)]="note" (ngModelChange)="emitDraft()" />
            <span><ui-app-icon name="note" /></span
            ><strong>{{ 'pin.types.notes' | translate }}</strong></label
          >
          <label
            ><input type="checkbox" [(ngModel)]="photo" (ngModelChange)="emitDraft()" />
            <span><ui-app-icon name="image" /></span
            ><strong>{{ 'pin.types.photos' | translate }}</strong></label
          >
        </div>
      </fieldset>
      <div class="panel-actions">
        <button type="button" class="button secondary" (click)="onCancel.emit()">
          {{ 'common.cancel' | translate }}
        </button>
        <button
          type="button"
          class="button primary"
          [disabled]="!canSubmit() || isSaving()"
          (click)="submit()"
        >
          {{ (isSaving() ? 'collection.creating' : 'collection.create') | translate }}
        </button>
      </div>
    </section>
  `,
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCreateDialogComponent {
  readonly isOpen = input(true);
  readonly canSubmit = input(false);
  readonly isSaving = input(false);
  readonly error = input<string | null>(null);
  readonly availableTypes = input.required<PinType[]>();
  readonly onSubmit = output<CreateCollectionRequest>();
  readonly onCancel = output<void>();
  readonly onDraftChange = output<CreateCollectionRequest>();
  name = '';
  emoji = '📌';
  link = true;
  note = true;
  photo = true;

  emitDraft(): void {
    this.onDraftChange.emit(this.draft());
  }
  submit(): void {
    this.onSubmit.emit(this.draft());
  }

  private draft(): CreateCollectionRequest {
    const allowedTypes: PinType[] = [];
    if (this.link) allowedTypes.push('link');
    if (this.note) allowedTypes.push('note');
    if (this.photo) allowedTypes.push('photo');
    return { name: this.name, emoji: this.emoji || '📌', allowedTypes };
  }
}

@Component({
  selector: 'ui-collection-settings',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    @if (collection(); as item) {
      <section class="panel-card settings-card" aria-labelledby="settings-title">
        <div class="eyebrow">{{ 'collection.singular' | translate }}</div>
        <h1 id="settings-title">
          {{ 'collection.settingsFor' | translate: { name: item.name } }}
        </h1>
        @if (error()) {
          <p class="error-banner" role="alert">{{ error() | translate }}</p>
        }
        <div class="form-grid">
          <label class="emoji-field"
            ><span>{{ 'common.emoji' | translate }}</span
            ><input [ngModel]="item.emoji" (ngModelChange)="onFieldChange.emit({ emoji: $event })"
          /></label>
          <label
            ><span>{{ 'common.name' | translate }}</span
            ><input [ngModel]="item.name" (ngModelChange)="onFieldChange.emit({ name: $event })"
          /></label>
        </div>
        <fieldset>
          <legend>{{ 'collection.allowedPinTypes' | translate }}</legend>
          <div class="check-list">
            @for (type of pinTypes; track type.value) {
              <label>
                <input
                  type="checkbox"
                  [checked]="item.allowedTypes.includes(type.value)"
                  (change)="onTypeToggle.emit(type.value)"
                />
                <span>{{ type.labelKey | translate }}</span>
              </label>
            }
          </div>
        </fieldset>
        <fieldset>
          <legend>{{ 'collection.visibility' | translate }}</legend>
          <div class="segmented wide">
            <button
              type="button"
              [class.active]="item.visibility === 'private'"
              (click)="onFieldChange.emit({ visibility: 'private' })"
            >
              {{ 'collection.private' | translate }}
            </button>
            <button
              type="button"
              [class.active]="item.visibility === 'link'"
              (click)="onFieldChange.emit({ visibility: 'link' })"
            >
              {{ 'collection.viaLink' | translate }}
            </button>
          </div>
          @if (item.visibility === 'link' && item.inviteToken) {
            <div class="invite-box">
              <code>{{ inviteUrl() }}</code
              ><button type="button" (click)="onCopyInvite.emit()">
                <ui-app-icon name="copy" /> {{ 'common.copy' | translate }}
              </button>
            </div>
          }
        </fieldset>
        <div class="panel-actions split">
          <button
            type="button"
            class="button danger-ghost"
            [disabled]="item.currentUserRole !== 'owner'"
            (click)="onDelete.emit()"
          >
            <ui-app-icon name="trash" /> {{ 'collection.delete' | translate }}
          </button>
          <div>
            <button type="button" class="button secondary" (click)="onCancel.emit()">
              {{ 'common.back' | translate }}
            </button>
            <button
              type="button"
              class="button primary"
              [disabled]="!canSave() || isSaving()"
              (click)="onSave.emit()"
            >
              {{ (isSaving() ? 'common.saving' : 'common.save') | translate }}
            </button>
          </div>
        </div>
      </section>
    }
  `,
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSettingsComponent {
  readonly collection = input<CollectionDetail | null>(null);
  readonly inviteUrl = input('');
  readonly canSave = input(false);
  readonly isSaving = input(false);
  readonly error = input<string | null>(null);
  readonly onFieldChange = output<UpdateCollectionRequest>();
  readonly onTypeToggle = output<PinType>();
  readonly onSave = output<void>();
  readonly onDelete = output<void>();
  readonly onCancel = output<void>();
  readonly onCopyInvite = output<void>();
  readonly pinTypes: { value: PinType; labelKey: string }[] = [
    { value: 'link', labelKey: 'pin.types.links' },
    { value: 'note', labelKey: 'pin.types.notes' },
    { value: 'photo', labelKey: 'pin.types.photos' },
  ];
}

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
