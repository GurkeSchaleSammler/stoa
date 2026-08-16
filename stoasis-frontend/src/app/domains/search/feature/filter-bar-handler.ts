import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SearchService } from '../data/application/search.service';
import { TagService } from '../data/application/tag.service';
import { FilterBarComponent } from '../ui/filter-bar';
import { PinType } from '../../../shared/models/pin-type';

@Component({
  selector: 'feature-filter-bar-handler',
  standalone: true,
  imports: [FilterBarComponent],
  template: `<ui-filter-bar
    [activeFilters]="search.activeFilters()"
    [availableTags]="tags.tags()"
    (onTypeFilterChange)="changeType($event)"
    (onTagFilterChange)="changeTag($event)"
    (onReset)="reset()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarHandlerComponent {
  protected readonly search = inject(SearchService);
  protected readonly tags = inject(TagService);
  changeType(type: PinType | null): void {
    this.search.setFilter(type, this.search.activeFilters().tag);
  }
  changeTag(tag: string | null): void {
    this.search.setFilter(this.search.activeFilters().type, tag);
  }
  reset(): void {
    this.search.setFilter(null, null);
  }
}
