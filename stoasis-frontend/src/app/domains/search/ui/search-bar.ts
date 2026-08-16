import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';

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
