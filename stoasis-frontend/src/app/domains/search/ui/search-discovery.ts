import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionContextStore } from '../../../shared/application/session-context.store';
import { SearchDiscoveryService } from '../data/application/search-discovery.service';
import { SearchService } from '../data/application/search.service';

/** Makes premium discovery controls visible alongside free basic search. */
@Component({
  selector: 'ui-search-discovery',
  imports: [FormsModule, TranslatePipe],
  providers: [SearchDiscoveryService],
  templateUrl: './search-discovery.html',
  styleUrl: './search-discovery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDiscoveryComponent {
  protected readonly discovery = inject(SearchDiscoveryService);
  protected readonly search = inject(SearchService);
  private readonly session = inject(SessionContextStore);
  readonly premium = computed(() => this.session.user()?.plan === 'premium');
  readonly name = signal('');
  readonly tags = signal('');
  readonly mode = signal<'all' | 'any'>('all');

  constructor() {
    void this.discovery.load();
  }

  applyTags(): void {
    if (this.premium()) this.search.setAdvanced(this.tags().split(','), this.mode());
  }

  reset(): void {
    this.tags.set('');
    this.search.setAdvanced([], 'all');
  }
}
