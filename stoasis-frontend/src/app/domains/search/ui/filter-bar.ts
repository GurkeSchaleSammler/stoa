import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Tag } from '../data/models/tag';
import { SearchFilters } from '../data/models/search-filters';
import { PinType } from '../../../shared/models/pin-type';

/** Presents the free tag and pin-type filters. */
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
    { value: 'portal', labelKey: 'pin.types.portals' },
    { value: 'skill', labelKey: 'skills.nav' },
  ];
}
