import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CollectionApi } from '../domains/collection/data/api/collection.api';
import { CollectionSummary } from '../domains/collection/data/models/collection-summary';
import { DashboardCollectionsStore } from './dashboard-collections.store';

describe('DashboardCollectionsStore', () => {
  const responses: Subject<CollectionSummary[]>[] = [];
  const api = {
    list: vi.fn(() => {
      const response = new Subject<CollectionSummary[]>();
      responses.push(response);
      return response;
    }),
  };

  beforeEach(() => {
    responses.length = 0;
    api.list.mockClear();
    TestBed.configureTestingModule({
      providers: [DashboardCollectionsStore, { provide: CollectionApi, useValue: api }],
    });
  });

  it('clears cached account data before a new load', () => {
    const store = TestBed.inject(DashboardCollectionsStore);
    const previousAccountBoard = { id: 'private-board' } as CollectionSummary;

    store.load();
    responses[0].next([previousAccountBoard]);
    expect(store.collections()).toEqual([previousAccountBoard]);

    store.load();

    expect(store.status()).toBe('loading');
    expect(store.collections()).toEqual([]);
  });

  it('always loads the unfiltered collection set', () => {
    const store = TestBed.inject(DashboardCollectionsStore);
    store.load();
    expect(api.list).toHaveBeenCalledWith('all');
  });
});
