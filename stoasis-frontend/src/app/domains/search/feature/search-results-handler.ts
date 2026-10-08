import { SearchDiscoveryComponent } from '../ui/search-discovery';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../data/application/search.service';
import { TagService } from '../data/application/tag.service';
import { SearchResultsComponent } from '../ui/search-results';
import { FilterBarHandlerComponent } from './filter-bar-handler';
import { SearchBarHandlerComponent } from './search-bar-handler';
import { TagManagerHandlerComponent } from './tag-manager-handler';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchResult } from '../data/models/search-result';

/** Combines search controls and navigation to matching boards. */
@Component({
  selector: 'feature-search-results-handler',
  standalone: true,
  imports: [
    SearchDiscoveryComponent,
    SearchBarHandlerComponent,
    FilterBarHandlerComponent,
    SearchResultsComponent,
    TagManagerHandlerComponent,
    TranslatePipe,
  ],
  template: `<main class="search-page">
    <header>
      <p>{{ 'search.eyebrow' | translate }}</p>
      <h1>{{ 'common.search' | translate }}</h1>
    </header>
    <feature-search-bar-handler /><feature-filter-bar-handler />
    @if (search.error()) {
      <p class="search-error" role="alert">{{ search.error() | translate }}</p>
    }
    <ui-search-results
      [results]="search.results()"
      [isLoading]="search.isLoading()"
      [hasQuery]="search.hasQuery()"
      (onResultClick)="openResult($event)"
    />
    @if (search.hasQuery() && (search.page() > 0 || search.hasNext())) {
      <nav class="search-pagination" [attr.aria-label]="'discovery.pages' | translate">
        <button
          [disabled]="search.isLoading() || search.page() === 0"
          (click)="search.goToPage(search.page() - 1)"
        >
          {{ 'common.back' | translate }}
        </button>
        <span>{{ search.page() + 1 }}</span>
        <button
          [disabled]="search.isLoading() || !search.hasNext()"
          (click)="search.goToPage(search.page() + 1)"
        >
          {{ 'portability.next' | translate }}
        </button>
      </nav>
    }
    <ui-search-discovery /><feature-tag-manager-handler />
  </main>`,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
      overflow: auto;
    }
    .search-page {
      width: min(820px, calc(100% - 2 * var(--page-gutter)));
      margin-inline: auto;
      padding: var(--page-padding);
    }
    .search-page header p {
      margin: 0;
      color: var(--accent-strong);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .search-page h1 {
      margin: 10px 0 28px;
      font-family: var(--font-display);
      font-size: var(--heading-size);
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.025em;
    }
    .search-error {
      padding: 10px 12px;
      border-radius: 9px;
      background: var(--danger-soft);
      color: var(--danger);
      font-size: 0.78rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsHandlerComponent {
  protected readonly search = inject(SearchService);
  private readonly tags = inject(TagService);
  private readonly router = inject(Router);
  constructor() {
    this.tags.loadTags();
  }
  openResult(result: SearchResult): void {
    if (result.type === 'skill') {
      void this.router.navigate(['/profile-boards', result.collectionId]);
      return;
    }
    void this.router.navigate(['/collections', result.collectionId], {
      queryParams: { pin: result.id },
    });
  }
}
