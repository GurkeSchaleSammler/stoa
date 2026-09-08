import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import { SearchQuery } from '../models/search-query';

/** Holds a named search and its reusable filters. */
export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
}

/** Manages saved queries and retrieves current tag counts. */
@Injectable()
export class SearchDiscoveryService {
  private readonly http = inject(HttpClient);
  readonly saved = signal<SavedSearch[]>([]);
  readonly usage = signal<{ name: string; count: number }[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async load(): Promise<void> {
    await this.run(this.http.get<SavedSearch[]>(`${API_URL}/search/saved`), (value) =>
      this.saved.set(value),
    );
  }

  async save(name: string, query: SearchQuery): Promise<void> {
    const tags = [...new Set([...(query.tags ?? []), ...(query.tag ? [query.tag] : [])])];
    await this.run(
      this.http.post<SavedSearch>(`${API_URL}/search/saved`, { name, query: { ...query, tags } }),
      (value) => this.saved.update((items) => [...items, value]),
    );
  }

  async delete(id: string): Promise<void> {
    await this.run(this.http.delete<void>(`${API_URL}/search/saved/${id}`), () =>
      this.saved.update((items) => items.filter((item) => item.id !== id)),
    );
  }

  async analytics(): Promise<void> {
    await this.run(
      this.http.get<{ name: string; count: number }[]>(`${API_URL}/search/tag-analytics`),
      (value) => this.usage.set(value),
    );
  }

  private async run<T>(request: Observable<T>, apply: (value: T) => void): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      apply(await firstValueFrom(request));
    } catch (error) {
      this.error.set(
        (error as { error?: { message?: string } })?.error?.message ?? 'errors.search',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
