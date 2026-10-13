import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PinService } from './pin.service';
import { BoardApi } from '../api/board.api';
import { BoardElementsStore } from './board-elements.store';
import { StackActionsService } from './stack-actions.service';
import { ConnectorActionsService } from './connector-actions.service';
import { DecorationActionsService } from './decoration-actions.service';
import { SessionContextStore } from '../../../../shared/application/session-context.store';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { ViewportService } from '../../../../shared/application/viewport.service';
import { initialBoardElements } from '../models/initial-board-elements';

describe('Board presentation on mobile', () => {
  const compact = signal(true);

  beforeEach(() => {
    compact.set(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: ViewportService, useValue: { compact } },
        {
          provide: BoardApi,
          useValue: {
            context: () => of(null),
            list: () => of([]),
            elements: () => of(initialBoardElements),
          },
        },
        { provide: SessionContextStore, useValue: {} },
        { provide: SnackbarService, useValue: {} },
        {
          provide: BoardElementsStore,
          useValue: {
            elements: signal(initialBoardElements),
            error: signal(null),
            reset: vi.fn(),
            set: vi.fn(),
          },
        },
        { provide: StackActionsService, useValue: {} },
        { provide: ConnectorActionsService, useValue: {} },
        { provide: DecorationActionsService, useValue: {} },
      ],
    });
  });

  it('starts mobile collections with readable cards', () => {
    expect(TestBed.inject(PinService).viewMode()).toBe('list');
  });

  it('starts desktop collections with the free canvas', () => {
    compact.set(false);
    expect(TestBed.inject(PinService).viewMode()).toBe('board');
  });

  it('preserves an explicit view choice across navigation and viewport changes', () => {
    const pins = TestBed.inject(PinService);
    pins.setViewMode('board');
    pins.loadPins('first');
    expect(pins.viewMode()).toBe('board');
    compact.set(false);
    pins.setViewMode('list');
    pins.loadPins('second');
    expect(pins.viewMode()).toBe('list');
  });
});
