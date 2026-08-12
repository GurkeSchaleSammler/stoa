import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SearchService } from '../data/application/search.service';
import { SearchBarComponent } from '../ui/search-components';

@Component({
  selector: 'feature-search-bar-handler',
  standalone: true,
  imports: [SearchBarComponent],
  template: `<ui-search-bar
    [query]="search.query()"
    [isSearching]="search.isLoading()"
    (onQueryChange)="search.search($event)"
    (onClear)="search.clear()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarHandlerComponent {
  protected readonly search = inject(SearchService);
}
