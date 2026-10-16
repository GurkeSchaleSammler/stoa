import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BoardExperienceStore } from './board-experience.store';
import { API_URL } from '../../../../shared/api/api-url';

const value = { paths: [], dates: [], presentationPathLimit: 7, connectorLabelLimit: 10 };
describe('BoardExperienceStore', () => {
  let store: BoardExperienceStore;
  let http: HttpTestingController;
  const url = (id: string) => `${API_URL}/collections/${id}/experience`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), BoardExperienceStore],
    });
    store = TestBed.inject(BoardExperienceStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('cancels obsolete board reads and resets errors on navigation', () => {
    store.load('a');
    const first = http.expectOne(url('a'));
    store.load('b');
    expect(first.cancelled).toBe(true);
    http.expectOne(url('b')).flush(value);
    expect(store.loading()).toBe(false);
    expect(store.value()).toEqual(value);
  });
  it('blocks double saves, exposes limit errors, and preserves the draft callback for successful saves', () => {
    store.load('a');
    http.expectOne(url('a')).flush(value);
    const saved = vi.fn();
    const draft = { name: 'Tour', pinIds: ['pin'] };
    store.savePath(draft, saved);
    store.savePath(draft, saved);
    http
      .expectOne(url('a') + '/paths')
      .flush({ code: 'board.presentation_path_limit' }, { status: 409, statusText: 'Conflict' });
    expect(store.saving()).toBe(false);
    expect(store.error()).toBe('board.presentation_path_limit');
    expect(saved).not.toHaveBeenCalled();
    store.savePath(draft, saved);
    http.expectOne(url('a') + '/paths').flush({ ...draft, id: 'path' });
    http.expectOne(url('a')).flush({ ...value, paths: [{ ...draft, id: 'path' }] });
    expect(saved).toHaveBeenCalledOnce();
    expect(store.error()).toBeNull();
  });
  it('does not apply a mutation response to the next board', () => {
    store.load('a');
    http.expectOne(url('a')).flush(value);
    store.saveDate({ pinId: 'pin', startDate: '2026-10-13', endDate: null }, vi.fn());
    const save = http.expectOne(url('a') + '/dates/pin');
    store.load('b');
    expect(save.cancelled).toBe(true);
    http.expectOne(url('b')).flush(value);
    expect(store.saving()).toBe(false);
  });
});
