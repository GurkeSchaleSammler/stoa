import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { PinType } from '../../../shared/models/core.models';
import { SearchFilters, SearchResult, Tag } from '../data/models/search.models';

@Component({
  selector: 'ui-search-bar',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `<label class="search-input"
    ><ui-app-icon name="search" /><span class="sr-only">{{ 'search.allPins' | translate }}</span
    ><input
      type="search"
      autofocus
      [placeholder]="'search.placeholder' | translate"
      [ngModel]="query()"
      (ngModelChange)="onQueryChange.emit($event)"
    />
    @if (isSearching()) {
      <span class="mini-loader" [attr.aria-label]="'search.searching' | translate"></span>
    } @else if (query()) {
      <button type="button" [attr.aria-label]="'search.clear' | translate" (click)="onClear.emit()">
        <ui-app-icon name="close" />
      </button>
    }
  </label>`,
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  readonly query = input('');
  readonly isSearching = input(false);
  readonly onQueryChange = output<string>();
  readonly onClear = output<void>();
}

@Component({
  selector: 'ui-filter-bar',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `<div class="filter-bar">
    <div class="type-filters">
      <button
        type="button"
        [class.active]="!activeFilters().type"
        (click)="onTypeFilterChange.emit(null)"
      >
        {{ 'common.all' | translate }}
      </button>
      @for (type of types; track type.value) {
        <button
          type="button"
          [class.active]="activeFilters().type === type.value"
          (click)="onTypeFilterChange.emit(type.value)"
        >
          {{ type.labelKey | translate }}
        </button>
      }
    </div>
    <label
      ><span class="sr-only">{{ 'search.filterTag' | translate }}</span
      ><select
        [ngModel]="activeFilters().tag || ''"
        (ngModelChange)="onTagFilterChange.emit($event || null)"
      >
        <option value="">{{ 'search.allTags' | translate }}</option>
        @for (tag of availableTags(); track tag.id) {
          <option [value]="tag.name">#{{ tag.name }}</option>
        }
      </select></label
    >
    @if (activeFilters().type || activeFilters().tag) {
      <button type="button" class="reset-filter" (click)="onReset.emit()">
        {{ 'common.reset' | translate }}
      </button>
    }
  </div>`,
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  readonly activeFilters = input.required<SearchFilters>();
  readonly availableTags = input.required<Tag[]>();
  readonly onTypeFilterChange = output<PinType | null>();
  readonly onTagFilterChange = output<string | null>();
  readonly onReset = output<void>();
  readonly types: { value: PinType; labelKey: string }[] = [
    { value: 'link', labelKey: 'pin.types.links' },
    { value: 'note', labelKey: 'pin.types.notes' },
    { value: 'photo', labelKey: 'pin.types.photos' },
  ];
}

@Component({
  selector: 'ui-search-results',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: ` <section class="result-section" aria-live="polite">
    @if (isLoading()) {
      <div class="result-skeleton">
        @for (item of skeletons; track item) {
          <span></span>
        }
      </div>
    } @else if (!hasQuery()) {
      <div class="search-empty">
        <span><ui-app-icon name="search" /></span>
        <h2>{{ 'search.emptyTitle' | translate }}</h2>
        <p>{{ 'search.emptyLead' | translate }}</p>
      </div>
    } @else if (results().length === 0) {
      <div class="search-empty">
        <span><ui-app-icon name="warning" /></span>
        <h2>{{ 'search.noResults' | translate }}</h2>
        <p>{{ 'search.noResultsLead' | translate }}</p>
      </div>
    } @else {
      <p class="result-count">
        {{ 'search.resultCount' | translate: { count: results().length } }}
      </p>
      <div class="results">
        @for (result of results(); track result.id) {
          <button type="button" class="result-card" (click)="onResultClick.emit(result)">
            <span class="result-icon">
              <ui-app-icon
                [name]="result.type === 'link' ? 'link' : result.type === 'note' ? 'note' : 'image'"
              />
            </span>
            <span class="result-copy">
              <small>{{ result.collectionName }}</small>
              <strong>
                @switch (result.type) {
                  @case ('link') {
                    {{ result.data.title }}
                  }
                  @case ('note') {
                    {{ result.data.content }}
                  }
                  @case ('photo') {
                    {{ result.data.caption || ('pin.photo' | translate) }}
                  }
                }
              </strong>
              <span>
                @for (tag of result.tags; track tag) {
                  <em>#{{ tag }}</em>
                }
              </span>
            </span>
            <ui-app-icon name="chevron-right" />
          </button>
        }
      </div>
    }
  </section>`,
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsComponent {
  readonly results = input.required<SearchResult[]>();
  readonly isLoading = input(false);
  readonly hasQuery = input(false);
  readonly onResultClick = output<SearchResult>();
  readonly skeletons = [1, 2, 3];
}

@Component({
  selector: 'ui-tag-manager',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `<details class="tag-manager">
    <summary>
      {{ 'search.manageTags' | translate }} <span>{{ tags().length }}</span>
    </summary>
    <div class="tag-create">
      <input
        [placeholder]="'search.newTag' | translate"
        [(ngModel)]="newTagName"
        (keydown.enter)="create()"
      /><button type="button" [disabled]="!canCreate() || !newTagName.trim()" (click)="create()">
        {{ 'common.add' | translate }}
      </button>
    </div>
    <div class="tag-list">
      @for (tag of tags(); track tag.id) {
        <span
          >#{{ tag.name }}
          <button
            type="button"
            [attr.aria-label]="'search.deleteTag' | translate: { tag: tag.name }"
            (click)="onDeleteTag.emit(tag.id)"
          >
            <ui-app-icon name="close" /></button
        ></span>
      }
    </div>
  </details>`,
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagManagerComponent {
  readonly tags = input.required<Tag[]>();
  readonly canCreate = input(true);
  readonly onCreateTag = output<string>();
  readonly onDeleteTag = output<string>();
  newTagName = '';
  create(): void {
    if (this.newTagName.trim()) {
      this.onCreateTag.emit(this.newTagName.trim());
      this.newTagName = '';
    }
  }
}
