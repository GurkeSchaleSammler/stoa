import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BoardReuseHandlerComponent } from './board-reuse-handler';
import { BoardClipboardService } from '../data/application/board-clipboard.service';
import { PinService } from '../data/application/pin.service';
import { CollectionService } from '../../collection/data/application/collection.service';
import { OnboardingService } from '../../../shared/application/onboarding.service';
import { ViewportService } from '../../../shared/application/viewport.service';

describe('Mobile board reuse menu', () => {
  const compact = signal(true);

  beforeEach(() => {
    compact.set(true);
    TestBed.configureTestingModule({
      imports: [BoardReuseHandlerComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'de' }),
        { provide: ViewportService, useValue: { compact } },
        { provide: BoardClipboardService, useValue: { copied: signal(null) } },
        {
          provide: PinService,
          useValue: { canEdit: signal(true), isMutating: signal(false), selectedPin: signal(null) },
        },
        {
          provide: CollectionService,
          useValue: { isSaving: signal(false), error: signal(null), clearError: vi.fn() },
        },
        { provide: OnboardingService, useValue: { ready: signal(false), isSaving: signal(false) } },
      ],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(BoardReuseHandlerComponent);
    fixture.componentRef.setInput('context', {
      id: 'board',
      name: 'Board',
      isSystem: false,
      currentUserRole: 'owner',
    });
    fixture.detectChanges();
    const menu: HTMLDetailsElement = fixture.nativeElement.querySelector('.reuse-menu');
    const summary = menu.querySelector('summary')!;
    const action = menu.querySelector<HTMLButtonElement>('[data-tour="duplicate"]')!;
    return { fixture, menu, summary, action };
  }

  it('returns keyboard focus to the summary when Escape closes the menu', () => {
    const { menu, summary, action } = render();
    menu.open = true;
    action.focus();
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(summary);
  });

  it('restores focus before a duplicate action opens its modal', () => {
    const { menu, summary, action } = render();
    menu.open = true;
    action.focus();
    action.click();
    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(summary);
  });

  it('keeps desktop actions visible after Escape', () => {
    compact.set(false);
    const { menu, action } = render();
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.open).toBe(true);
  });
});
