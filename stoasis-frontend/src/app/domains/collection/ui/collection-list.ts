import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { CollectionFilter } from '../data/models/collection-filter';
import { CollectionSummary } from '../data/models/collection-summary';

@Component({
  selector: 'ui-collection-list',
  standalone: true,
  host: { style: 'display: block; height: 100%; min-height: 0' },
  imports: [FormsModule, RouterLink, TranslatePipe, AppIconComponent],
  template: `
    <nav class="collection-sidebar" [attr.aria-label]="'collection.plural' | translate">
      <div class="sidebar-brand">
        <a class="brand" routerLink="/" [attr.aria-label]="'shell.home' | translate"
          ><span><img src="/android-chrome-192x192.png" alt="" /></span> Stoasis</a
        >
        <a
          class="icon-button"
          routerLink="/search"
          [attr.aria-label]="'home.searchPins' | translate"
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
              [attr.title]="collection.name"
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
            </button>
          }
        }
      </div>

      <button
        type="button"
        class="new-collection"
        [attr.aria-label]="'collection.new' | translate"
        [attr.title]="'collection.new' | translate"
        (click)="onCreateClick.emit()"
      >
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
