import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../data/application/search.service';
import { TagService } from '../data/application/tag.service';
import { SearchResult } from '../data/models/search.models';
import { SearchResultsComponent } from '../ui/search-components';
import { FilterBarHandlerComponent } from './filter-bar-handler';
import { SearchBarHandlerComponent } from './search-bar-handler';
import { TagManagerHandlerComponent } from './tag-manager-handler';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'feature-search-results-handler',
  standalone: true,
  imports: [
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
    /><feature-tag-manager-handler />
  </main>`,
  styles: `
    :host {
      display: block;
      min-height: 100%;
      overflow: auto;
    }
    .search-page {
      width: min(820px, calc(100% - 32px));
      margin: 0 auto;
      padding: clamp(28px, 6vw, 70px) 0;
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
      margin: 4px 0 25px;
      font-family: var(--font-display);
      font-size: clamp(2rem, 6vw, 3.5rem);
      letter-spacing: -0.05em;
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
    void this.router.navigate(['/collections', result.collectionId], {
      queryParams: { pin: result.id },
    });
  }
}
