import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Pin } from '../../../shared/models/pin';
import { initialBoardElements } from '../data/models/initial-board-elements';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { BoardCanvasComponent } from './board-canvas';
import { PinGridChange } from './models/pin-grid-change';

function note(id = 'note', x = 20, width = 16): Pin {
  return {
    id,
    collectionId: 'board',
    createdBy: 'user',
    createdByName: 'User',
    createdByAvatarUrl: null,
    sortOrder: 1,
    tags: [],
    comments: [],
    createdAt: '2026-10-13',
    type: 'note',
    data: { content: '**Note**', color: 'white' },
    grid: {
      id,
      x,
      y: 20,
      width,
      heightClips: 12,
      baseHeightClips: 12,
      manualSize: false,
      layer: 1,
      contentType: 'note',
    },
  };
}

function pointer(clientX = 0, clientY = 0): PointerEvent {
  return {
    pointerId: 1,
    button: 0,
    clientX,
    clientY,
    currentTarget: document.createElement('button'),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as PointerEvent;
}

describe('BoardCanvasComponent pin resizing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardCanvasComponent],
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();
  });

  function canvas(pins: Pin[] = [note()], editable = true) {
    const fixture = TestBed.createComponent(BoardCanvasComponent);
    fixture.componentRef.setInput('pins', pins);
    fixture.componentRef.setInput('elements', initialBoardElements);
    fixture.componentRef.setInput('canEdit', editable);
    fixture.detectChanges();
    const changes: PinGridChange[] = [];
    fixture.componentInstance.onGridChange.subscribe((change) => changes.push(change));
    return { fixture, component: fixture.componentInstance, changes };
  }

  it('limits width and height to twice the original size, including after saving and reloading', () => {
    const { component, changes } = canvas();
    component.startPinResize(pointer(), note(), 'right');
    component.movePinResize(pointer(10000));
    expect(component.cardWidth(note())).toBe(32 * CLIP_SIZE_PX);
    component.endPinResize(pointer(10000));
    expect(changes[0].grid).toMatchObject({ width: 32, manualSize: true });

    const saved = note();
    saved.grid = { ...saved.grid, ...changes[0].grid };
    component.startPinResize(pointer(), saved, 'bottom');
    component.movePinResize(pointer(0, 10000));
    component.endPinResize(pointer(0, 10000));
    expect(changes[1].grid).toMatchObject({ width: 32, heightClips: 24 });
    saved.grid = { ...saved.grid, ...changes[1].grid };
    component.startPinResize(pointer(), saved, 'bottom');
    component.movePinResize(pointer(0, 10000));
    expect(component.cardHeight(saved)).toBe(24 * CLIP_SIZE_PX);
    component.endPinResize(pointer(0, 10000));
    expect(changes).toHaveLength(2);
  });

  it('accounts for zoom and keeps the opposite edge fixed when pulling left and top', () => {
    const { component, changes } = canvas();
    component.setZoom(2);
    component.startPinResize(pointer(), note(), 'left');
    component.movePinResize(pointer(-8 * CLIP_SIZE_PX * 2));
    expect(component.cardLeft(note())).toBe(12 * CLIP_SIZE_PX);
    expect(component.cardWidth(note())).toBe(24 * CLIP_SIZE_PX);
    component.endPinResize(pointer());
    expect(changes[0].grid.x + changes[0].grid.width!).toBe(36);

    component.startPinResize(pointer(), note(), 'top');
    component.movePinResize(pointer(0, -6 * CLIP_SIZE_PX * 2));
    component.endPinResize(pointer());
    expect(changes[1].grid).toMatchObject({ y: 14, heightClips: 18 });
  });

  it('clamps growth at the board edge and supports shrinking to the initial size', () => {
    const item = note('edge', 140);
    const { component, changes } = canvas([item]);
    component.startPinResize(pointer(), item, 'right');
    component.movePinResize(pointer(10000));
    component.endPinResize(pointer());
    expect(changes[0].grid.width).toBe(20);

    item.grid = { ...item.grid, width: 32, heightClips: 24, manualSize: true, x: 20 };
    component.startPinResize(pointer(), item, 'right');
    component.movePinResize(pointer(-10000));
    component.endPinResize(pointer());
    expect(changes[1].grid.width).toBe(16);
    component.startPinResize(pointer(), item, 'bottom');
    component.movePinResize(pointer(0, -10000));
    component.endPinResize(pointer());
    expect(changes[2].grid.heightClips).toBe(12);
  });

  it('rejects excessive overlap without stacking, and cancels without saving or opening a pin', () => {
    const { component, changes } = canvas([note(), note('neighbor', 36)]);
    const stack = vi.fn();
    const open = vi.fn();
    component.onStackDrop.subscribe(stack);
    component.onSelectPin.subscribe(open);
    component.startPinResize(pointer(), note(), 'right');
    component.movePinResize(pointer(10000));
    expect(component.isInvalidDrag('note')).toBe(true);
    component.endPinResize(pointer());
    expect(changes).toHaveLength(0);
    expect(stack).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    component.startPinResize(pointer(), note(), 'bottom');
    component.movePinResize(pointer(0, 100));
    component.cancelPinResize(pointer());
    expect(component.isResizing('note')).toBe(false);
    expect(changes).toHaveLength(0);
  });

  it('only provides resize handles to editors', () => {
    const { fixture, component, changes } = canvas([note()], false);
    expect(fixture.nativeElement.querySelector('.pin-resize-edge')).toBeNull();
    component.startPinResize(pointer(), note(), 'right');
    component.movePinResize(pointer(10000));
    component.endPinResize(pointer());
    expect(changes).toHaveLength(0);
  });

  it('supports arrow keys and keeps automatic measurements from overwriting a saved size', () => {
    const item = note();
    const { fixture, component, changes } = canvas([item]);
    const right = fixture.nativeElement.querySelector(
      '.pin-resize-edge.right',
    ) as HTMLButtonElement;
    right.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(changes[0].grid).toMatchObject({ width: 17, heightClips: 12, manualSize: true });
    item.grid = { ...item.grid, ...changes[0].grid };
    fixture.componentRef.setInput('pins', [{ ...item }]);
    fixture.detectChanges();
    component['reportMeasuredHeight'](item.id, 9);
    expect(changes).toHaveLength(1);
    expect(component.cardWidth(item)).toBe(17 * CLIP_SIZE_PX);
  });
});
