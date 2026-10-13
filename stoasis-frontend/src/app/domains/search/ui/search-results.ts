import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { SearchResult } from '../data/models/search-result';

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
                [name]="
                  result.type === 'link'
                    ? 'link'
                    : result.type === 'note'
                      ? 'note'
                      : result.type === 'photo'
                        ? 'image'
                        : result.type === 'portal'
                          ? 'door'
                          : 'graduation-cap'
                "
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
                  @case ('portal') {
                    {{ result.data.label }}
                  }
                  @case ('skill') {
                    {{ result.data.skillName }}
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
