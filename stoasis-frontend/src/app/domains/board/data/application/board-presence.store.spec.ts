import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { BoardPresenceApi } from '../api/board-presence.api';
import { BoardParticipant } from '../models/board-presence';
import { BoardPresenceStore } from './board-presence.store';

describe('BoardPresenceStore', () => {
  let store: BoardPresenceStore;
  let responses: Subject<BoardParticipant[]>[];
  const api = { exchange: vi.fn(), leave: vi.fn(() => of(undefined)) };
  const person: BoardParticipant = { userId: 'b', name: 'Bo', cursor: { x: 14, y: 28 } };

  beforeEach(() => {
    vi.useFakeTimers();
    responses = [];
    api.exchange.mockReset().mockImplementation(() => {
      const response = new Subject<BoardParticipant[]>();
      responses.push(response);
      return response;
    });
    api.leave.mockClear();
    TestBed.configureTestingModule({
      providers: [BoardPresenceStore, { provide: BoardPresenceApi, useValue: api }],
    });
    store = TestBed.inject(BoardPresenceStore);
  });
  afterEach(() => {
    store.disconnect();
    vi.useRealTimers();
  });

  it('throttles movement and permits only one exchange in flight', () => {
    store.connect('a');
    store.move({ x: 10, y: 20 });
    store.move({ x: 30, y: 40 });
    vi.advanceTimersByTime(1000);
    expect(api.exchange).toHaveBeenCalledTimes(1);
    responses[0].next([person]);
    responses[0].complete();
    vi.advanceTimersByTime(250);
    expect(api.exchange).toHaveBeenLastCalledWith('a', expect.any(String), { x: 30, y: 40 });
    expect(store.participants()).toEqual([person]);
  });

  it('clears presence on navigation and ignores a late response from the old board', () => {
    store.connect('a');
    const oldClient = api.exchange.mock.calls[0][1];
    store.connect('b');
    responses[0].next([person]);
    expect(store.participants()).toEqual([]);
    expect(api.leave).toHaveBeenCalledWith('a', oldClient);
    store.disconnect();
    vi.advanceTimersByTime(10000);
    expect(api.exchange).toHaveBeenCalledTimes(2);
  });

  it('clears stale cursors on network failure and recovers with a bounded retry', () => {
    store.connect('a');
    responses[0].next([person]);
    responses[0].complete();
    vi.advanceTimersByTime(250);
    responses[1].error(new HttpErrorResponse({ status: 503 }));
    expect(store.participants()).toEqual([]);
    expect(store.status()).toBe('reconnecting');
    vi.advanceTimersByTime(1000);
    responses[2].next([person]);
    responses[2].complete();
    expect(store.status()).toBe('connected');
  });

  it('stops exchanging after membership or session access is revoked', () => {
    store.connect('a');
    responses[0].error(new HttpErrorResponse({ status: 403 }));
    vi.advanceTimersByTime(30000);
    expect(api.exchange).toHaveBeenCalledTimes(1);
    expect(store.participants()).toEqual([]);
    expect(store.status()).toBe('unavailable');
  });
});
