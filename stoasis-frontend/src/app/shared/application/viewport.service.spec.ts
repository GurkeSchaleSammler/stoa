import { TestBed } from '@angular/core/testing';
import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('tracks the mobile breakpoint and releases its listener on destruction', () => {
    let changed: ((event: MediaQueryListEvent) => void) | undefined;
    const remove = vi.fn();
    const media = {
      matches: true,
      addEventListener: vi.fn((_type, listener) => (changed = listener)),
      removeEventListener: remove,
    };
    const match = vi.fn(() => media);
    vi.stubGlobal('matchMedia', match);
    const viewport = TestBed.inject(ViewportService);
    expect(match).toHaveBeenCalledWith('(max-width: 760px)');
    expect(viewport.compact()).toBe(true);
    changed!({ matches: false } as MediaQueryListEvent);
    expect(viewport.compact()).toBe(false);
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledWith('change', changed);
  });

  it('supports rendering environments without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(TestBed.inject(ViewportService).compact()).toBe(false);
  });
});
