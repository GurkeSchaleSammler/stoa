import { Injectable, signal } from '@angular/core';

const storagePrefix = 'stoasis.dashboard.favorites';

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesStore {
  private readonly favoriteCollectionIds = signal<ReadonlySet<string>>(new Set());
  private userId: string | null = null;

  readonly favorites = this.favoriteCollectionIds.asReadonly();

  load(userId: string): void {
    this.userId = userId;
    const stored = localStorage.getItem(this.storageKey(userId));
    if (!stored) {
      this.favoriteCollectionIds.set(new Set());
      return;
    }

    try {
      const ids = JSON.parse(stored);
      this.favoriteCollectionIds.set(
        new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []),
      );
    } catch {
      this.favoriteCollectionIds.set(new Set());
    }
  }

  toggle(collectionId: string): void {
    if (!this.userId) return;
    const next = new Set(this.favoriteCollectionIds());
    if (next.has(collectionId)) next.delete(collectionId);
    else next.add(collectionId);
    this.favoriteCollectionIds.set(next);
    localStorage.setItem(this.storageKey(this.userId), JSON.stringify([...next]));
  }

  private storageKey(userId: string): string {
    return `${storagePrefix}.${userId}`;
  }
}
