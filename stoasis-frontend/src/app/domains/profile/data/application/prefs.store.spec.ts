import { TestBed } from '@angular/core/testing';
import { colorPalettes } from '../models/profile.models';
import { PrefsStore } from './prefs.store';

describe('PrefsStore', () => {
  beforeEach(() => {
    localStorage.removeItem('stoa-preferences');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.removeItem('stoa-preferences');
  });

  it('uses the default palette without changing the system mode', () => {
    const store = TestBed.inject(PrefsStore);

    expect(store.palette()).toBe('default');
    expect(store.theme()).toBe('system');
  });

  it('changes palette and brightness independently', () => {
    const store = TestBed.inject(PrefsStore);

    store.setPalette('yellow');
    store.setTheme('dark');

    expect(store.palette()).toBe('yellow');
    expect(store.theme()).toBe('dark');
  });

  it('accepts every registered color palette', () => {
    const store = TestBed.inject(PrefsStore);

    for (const palette of colorPalettes) {
      store.setPalette(palette);
      expect(store.palette()).toBe(palette);
    }
  });

  it('migrates saved preferences from before palettes existed', () => {
    localStorage.setItem(
      'stoa-preferences',
      JSON.stringify({ theme: 'dark', defaultView: 'list' }),
    );

    const store = TestBed.inject(PrefsStore);

    expect(store.theme()).toBe('dark');
    expect(store.palette()).toBe('default');
    expect(store.defaultView()).toBe('list');
  });
});
