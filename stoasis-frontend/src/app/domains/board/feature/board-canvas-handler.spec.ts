import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { PinService } from '../data/application/pin.service';
import { BoardCanvasHandlerComponent } from './board-canvas-handler';

describe('BoardCanvasHandlerComponent', () => {
  const params = new BehaviorSubject(convertToParamMap({ id: 'coll-japan' }));
  const queryParams = new BehaviorSubject(convertToParamMap({}));
  const internalBoardState = signal(0);
  const pins = {
    sortedPins: signal([]),
    elements: signal({ stacks: [], connectors: [], zones: [], labels: [], stickers: [] }),
    context: signal(null),
    viewMode: signal('board'),
    selectedPinId: signal(null),
    selectedPin: signal(null),
    canEdit: signal(true),
    isLoading: signal(false),
    error: signal(null),
    loadPins: vi.fn(() => internalBoardState.set(internalBoardState() + 1)),
    selectPin: vi.fn(() => internalBoardState.set(internalBoardState() + 1)),
    reorderPin: vi.fn(),
    updateGrid: vi.fn(),
    updateStack: vi.fn(),
    releaseStackChild: vi.fn(),
    dissolveStack: vi.fn(),
    createStack: vi.fn(),
    addToStack: vi.fn(),
    createConnector: vi.fn(),
    deleteConnector: vi.fn(),
    createZone: vi.fn(),
    updateZone: vi.fn(),
    deleteZone: vi.fn(),
    createLabel: vi.fn(),
    updateLabel: vi.fn(),
    deleteLabel: vi.fn(),
    createSticker: vi.fn(),
    updateSticker: vi.fn(),
    deleteSticker: vi.fn(),
    setViewMode: vi.fn(),
  };

  beforeEach(async () => {
    params.next(convertToParamMap({ id: 'coll-japan' }));
    queryParams.next(convertToParamMap({}));
    internalBoardState.set(0);
    pins.loadPins.mockClear();
    pins.selectPin.mockClear();

    await TestBed.configureTestingModule({
      imports: [BoardCanvasHandlerComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'de', lang: 'de' }),
        { provide: PinService, useValue: pins },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params.asObservable(),
            queryParamMap: queryParams.asObservable(),
            snapshot: {
              paramMap: convertToParamMap({ id: 'coll-japan' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('reloads the content when Angular reuses the route for another collection', () => {
    const fixture = TestBed.createComponent(BoardCanvasHandlerComponent);
    fixture.detectChanges();

    expect(pins.loadPins).toHaveBeenLastCalledWith('coll-japan');

    params.next(convertToParamMap({ id: 'coll-dev' }));
    fixture.detectChanges();

    expect(pins.loadPins).toHaveBeenLastCalledWith('coll-dev');
    expect(pins.loadPins).toHaveBeenCalledTimes(2);
  });

  it('does not retrigger route effects when the pin service changes its own signals', () => {
    const fixture = TestBed.createComponent(BoardCanvasHandlerComponent);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(pins.loadPins).toHaveBeenCalledTimes(1);
    expect(pins.selectPin).toHaveBeenCalledTimes(1);
  });
});
