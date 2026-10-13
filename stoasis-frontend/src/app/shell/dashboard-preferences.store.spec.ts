import { TestBed } from '@angular/core/testing';
import { DashboardPreferencesStore } from './dashboard-preferences.store';

describe('DashboardPreferencesStore', () => {
  let store: DashboardPreferencesStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(DashboardPreferencesStore);
  });

  it('persists favorites per user', () => {
    store.load('user-a');
    store.toggle('board-1');

    const freshStore = new DashboardPreferencesStore();
    freshStore.load('user-a');

    expect(freshStore.favorites()).toEqual(new Set(['board-1']));
  });

  it('keeps favorites isolated between users', () => {
    store.load('user-a');
    store.toggle('board-1');
    store.load('user-b');

    expect(store.favorites().size).toBe(0);
  });

  it('recovers from invalid stored data', () => {
    localStorage.setItem('stoasis.dashboard.favorites.user-a', '{invalid');
    store.load('user-a');
    expect(store.favorites().size).toBe(0);
  });
});
