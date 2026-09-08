import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { SearchApi } from '../api/search.api';
import { SearchResult } from '../models/search-result';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const api = { search: vi.fn() };
  let service: SearchService;

  beforeEach(() => {
    vi.useFakeTimers();
    api.search.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({ providers: [{ provide: SearchApi, useValue: api }] });
    service = TestBed.inject(SearchService);
  });
  afterEach(() => vi.useRealTimers());

  it('cancels an old request immediately and ignores its late response', async () => {
    const old = new Subject<SearchResult[]>();
    api.search.mockReturnValueOnce(old).mockReturnValueOnce(of([]));
    service.search('old');
    await vi.advanceTimersByTimeAsync(250);
    expect(old.observed).toBe(true);
    service.search('new');
    expect(old.observed).toBe(false);
    old.next([{ id: 'stale' } as SearchResult]);
    await vi.advanceTimersByTimeAsync(250);
    expect(service.results()).toEqual([]);
    expect(service.query()).toBe('new');
  });

  it('supports filters without text and resets pagination when filters change', async () => {
    service.setFilter('note', 'work');
    await vi.advanceTimersByTimeAsync(250);
    expect(service.hasQuery()).toBe(true);
    expect(api.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: '', type: 'note', tag: 'work', page: 0 }),
    );
    service.goToPage(1);
    await vi.advanceTimersByTimeAsync(250);
    service.setFilter('link', null);
    expect(service.page()).toBe(0);
  });

  it('clears pending results and permits retrying the same failed query', async () => {
    api.search.mockReturnValueOnce(throwError(() => ({ error: { message: 'Unavailable' } })));
    service.search('retry');
    await vi.advanceTimersByTimeAsync(250);
    expect(service.error()).toBe('Unavailable');
    service.search('retry');
    await vi.advanceTimersByTimeAsync(250);
    expect(service.error()).toBeNull();
    service.clear();
    await vi.advanceTimersByTimeAsync(250);
    expect(service.hasQuery()).toBe(false);
    expect(service.results()).toEqual([]);
  });
});
