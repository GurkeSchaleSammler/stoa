import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionService } from '../domains/collection/data/application/collection.service';
import { CollectionSummary } from '../domains/collection/data/models/collection-summary';
import { SessionContextStore } from '../shared/application/session-context.store';
import { LanguageService } from '../shared/application/language-service';
import { AppIconComponent } from '../shared/ui/app-icon';
import { DashboardPreferencesStore } from './dashboard-preferences.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AppIconComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly collections = inject(CollectionService);
  protected readonly session = inject(SessionContextStore);
  private readonly language = inject(LanguageService);
  private readonly preferences = inject(DashboardPreferencesStore);

  readonly recentCollections = computed(() =>
    [...this.collections.collections()]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 6),
  );
  readonly favoriteCollections = computed(() => {
    const favorites = this.preferences.favorites();
    return this.collections.collections().filter((collection) => favorites.has(collection.id));
  });
  readonly totalPins = computed(() =>
    this.collections.collections().reduce((total, collection) => total + collection.pinCount, 0),
  );
  readonly sharedCount = computed(
    () =>
      this.collections.collections().filter((collection) => collection.members.length > 1).length,
  );

  constructor() {
    effect(() => {
      const userId = this.session.userId();
      if (userId) this.preferences.load(userId);
    });
  }

  isFavorite(collectionId: string): boolean {
    return this.preferences.favorites().has(collectionId);
  }

  toggleFavorite(collection: CollectionSummary): void {
    this.preferences.toggle(collection.id);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.language.currentLanguageKey(), {
      dateStyle: 'medium',
    }).format(new Date(value));
  }
}
