import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { CollectionService } from '../data/application/collection.service';
import { CollectionListComponent } from '../ui/collection-list';
import { CollectionFilter } from '../data/models/collection-filter';

@Component({
  selector: 'feature-collection-list-handler',
  standalone: true,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `,
  imports: [CollectionListComponent],
  template: `
    <ui-collection-list
      [collections]="visibleCollections()"
      [activeTab]="activeTab()"
      [activeId]="activeId()"
      [isLoading]="collections.isLoading()"
      (onTabChange)="changeTab($event)"
      (onQueryChange)="query.set($event)"
      (onSelect)="selectCollection($event)"
      (onCreateClick)="createCollection()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionListHandlerComponent {
  readonly navigated = output<void>();
  protected readonly collections = inject(CollectionService);
  private readonly router = inject(Router);
  readonly activeTab = signal<CollectionFilter>('all');
  readonly activeId = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.collectionIdFromUrl()),
    ),
    { initialValue: this.collectionIdFromUrl() },
  );
  readonly query = signal('');
  readonly visibleCollections = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('de');
    const items = this.collections.filteredCollections();
    return query
      ? items.filter((item) => item.name.toLocaleLowerCase('de').includes(query))
      : items;
  });

  constructor() {
    this.collections.loadCollections('all');
  }

  changeTab(tab: CollectionFilter): void {
    this.activeTab.set(tab);
    this.collections.setFilter(tab);
  }

  selectCollection(id: string): void {
    this.navigated.emit();
    void this.router.navigate(['/collections', id]);
  }

  createCollection(): void {
    this.navigated.emit();
    void this.router.navigate(['/collections/new']);
  }

  private collectionIdFromUrl(): string | null {
    const match = this.router.url.match(/\/collections\/([^/?]+)/);
    return match?.[1] && match[1] !== 'new' ? match[1] : null;
  }
}
