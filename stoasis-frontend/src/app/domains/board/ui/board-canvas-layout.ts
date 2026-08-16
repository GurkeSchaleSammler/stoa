import { Directive, ElementRef, computed, effect } from '@angular/core';
import { GridBlock } from '../../../shared/models/grid-block';
import { BOARD_HEIGHT_CLIPS } from '../data/models/board-height-clips';
import { BOARD_WIDTH_CLIPS } from '../data/models/board-width-clips';
import { CARD_WIDTH_CLIPS } from '../data/models/card-width-clips';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { GridRect } from '../data/models/grid-rect';
import { intersectionArea } from '../data/models/intersection-area';
import { overlapAllowed } from '../data/models/overlap-allowed';
import { StackBlock } from '../data/models/stack-block';
import { UpdateGridBlockRequest } from '../data/models/update-grid-block-request';
import { BoardCanvasState } from './board-canvas-state';
import { DragState } from './models/drag-state';
import { StackDragState } from './models/stack-drag-state';
import { StackTarget } from './models/stack-target';

@Directive()
export abstract class BoardCanvasLayout extends BoardCanvasState {
  readonly addPosition = computed(() => this.findAddPosition());

  constructor() {
    super();
    effect(() => this.observeCardHeights(this.cardElements()));
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      if (this.rejectedTimer) clearTimeout(this.rejectedTimer);
    });
  }

  protected findStackTarget(pinId: string, grid: UpdateGridBlockRequest): StackTarget | null {
    const candidate: GridRect = {
      x: grid.x,
      y: grid.y,
      width: CARD_WIDTH_CLIPS,
      height: grid.heightClips,
    };
    const targets: Array<{ target: StackTarget; ratio: number }> = [];
    for (const pin of this.visiblePins()) {
      if (pin.id === pinId) continue;
      const overlap = intersectionArea(candidate, {
        x: pin.grid.x,
        y: pin.grid.y,
        width: CARD_WIDTH_CLIPS,
        height: pin.grid.heightClips,
      });
      targets.push({
        target: { id: pin.id, type: 'pin' },
        ratio:
          overlap /
          Math.min(CARD_WIDTH_CLIPS * grid.heightClips, CARD_WIDTH_CLIPS * pin.grid.heightClips),
      });
    }
    for (const stack of this.elements().stacks) {
      const overlap = intersectionArea(candidate, {
        x: stack.x,
        y: stack.y,
        width: CARD_WIDTH_CLIPS,
        height: stack.heightClips,
      });
      targets.push({
        target: { id: stack.id, type: 'stack' },
        ratio:
          overlap /
          Math.min(CARD_WIDTH_CLIPS * grid.heightClips, CARD_WIDTH_CLIPS * stack.heightClips),
      });
    }
    return (
      targets.sort((a, b) => b.ratio - a.ratio).find((item) => item.ratio >= 0.72)?.target ?? null
    );
  }

  protected snapStack(state: StackDragState, stack: StackBlock): { x: number; y: number } {
    return {
      x: this.clamp(
        Math.round(state.leftPx / CLIP_SIZE_PX),
        0,
        BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS,
      ),
      y: this.clamp(
        Math.round(state.topPx / CLIP_SIZE_PX),
        0,
        BOARD_HEIGHT_CLIPS - stack.heightClips,
      ),
    };
  }

  protected stackDropAllowed(stack: StackBlock, position: { x: number; y: number }): boolean {
    const candidate = {
      x: position.x,
      y: position.y,
      width: CARD_WIDTH_CLIPS,
      height: stack.heightClips,
    };
    const pinsAllowed = this.visiblePins().every((pin) =>
      overlapAllowed(candidate, {
        x: pin.grid.x,
        y: pin.grid.y,
        width: CARD_WIDTH_CLIPS,
        height: pin.grid.heightClips,
      }),
    );
    const stacksAllowed = this.elements()
      .stacks.filter((item) => item.id !== stack.id)
      .every((item) =>
        overlapAllowed(candidate, {
          x: item.x,
          y: item.y,
          width: CARD_WIDTH_CLIPS,
          height: item.heightClips,
        }),
      );
    return pinsAllowed && stacksAllowed;
  }

  protected pinAnchor(pinId: string): { x: number; y: number } {
    const stack = this.elements().stacks.find((item) => item.children.includes(pinId));
    if (stack) {
      const activeStack = this.stackDrag();
      const left = activeStack?.stackId === stack.id ? activeStack.leftPx : stack.x * CLIP_SIZE_PX;
      const top = activeStack?.stackId === stack.id ? activeStack.topPx : stack.y * CLIP_SIZE_PX;
      return {
        x: left + (CARD_WIDTH_CLIPS * CLIP_SIZE_PX) / 2,
        y: top + (stack.heightClips * CLIP_SIZE_PX) / 2,
      };
    }
    const pin = this.pins().find((item) => item.id === pinId);
    const activePin = this.drag();
    if (pin && activePin?.pinId === pinId) {
      return {
        x: activePin.leftPx + (CARD_WIDTH_CLIPS * CLIP_SIZE_PX) / 2,
        y: activePin.topPx + (activePin.origin.heightClips * CLIP_SIZE_PX) / 2,
      };
    }
    return pin
      ? {
          x: (pin.grid.x + CARD_WIDTH_CLIPS / 2) * CLIP_SIZE_PX,
          y: (pin.grid.y + pin.grid.heightClips / 2) * CLIP_SIZE_PX,
        }
      : { x: 0, y: 0 };
  }

  protected curvePath(x1: number, y1: number, x2: number, y2: number): string {
    const bend = Math.max(42, Math.min(150, Math.abs(x2 - x1) * 0.42));
    const direction = x2 >= x1 ? 1 : -1;
    return `M ${x1} ${y1} C ${x1 + bend * direction} ${y1}, ${x2 - bend * direction} ${y2}, ${x2} ${y2}`;
  }

  protected maxLayer(): number {
    return Math.max(
      0,
      ...this.pins().map((pin) => pin.grid.layer),
      ...this.elements().stacks.map((stack) => stack.layer),
      ...this.elements().labels.map((label) => label.layer),
      ...this.elements().stickers.map((sticker) => sticker.layer),
    );
  }

  protected snapCandidate(active: DragState): UpdateGridBlockRequest {
    const heightClips = active.origin.heightClips;
    return {
      x: this.clamp(
        Math.round(active.leftPx / CLIP_SIZE_PX),
        0,
        BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS,
      ),
      y: this.clamp(Math.round(active.topPx / CLIP_SIZE_PX), 0, BOARD_HEIGHT_CLIPS - heightClips),
      heightClips,
      layer: active.layer,
    };
  }

  protected dropAllowed(pinId: string, grid: UpdateGridBlockRequest): boolean {
    const candidate: GridRect = {
      x: grid.x,
      y: grid.y,
      width: CARD_WIDTH_CLIPS,
      height: grid.heightClips,
    };
    const pinsAllowed = this.visiblePins()
      .filter((pin) => pin.id !== pinId)
      .every((pin) =>
        overlapAllowed(candidate, {
          x: pin.grid.x,
          y: pin.grid.y,
          width: CARD_WIDTH_CLIPS,
          height: pin.grid.heightClips,
        }),
      );
    const stacksAllowed = this.elements().stacks.every((stack) =>
      overlapAllowed(candidate, {
        x: stack.x,
        y: stack.y,
        width: CARD_WIDTH_CLIPS,
        height: stack.heightClips,
      }),
    );
    return pinsAllowed && stacksAllowed;
  }

  protected findAddPosition(): { x: number; y: number } {
    const height = 12;
    const occupied = this.visiblePins().map((pin) => ({
      x: pin.grid.x,
      y: pin.grid.y,
      width: CARD_WIDTH_CLIPS,
      height: pin.grid.heightClips,
    }));
    occupied.push(
      ...this.elements().stacks.map((stack) => ({
        x: stack.x,
        y: stack.y,
        width: CARD_WIDTH_CLIPS,
        height: stack.heightClips,
      })),
    );
    for (let y = 0; y <= BOARD_HEIGHT_CLIPS - height; y += 2) {
      for (let x = 0; x <= BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS; x += CARD_WIDTH_CLIPS + 2) {
        const candidate = { x, y, width: CARD_WIDTH_CLIPS, height };
        if (occupied.every((rect) => intersectionArea(candidate, rect) === 0)) return { x, y };
      }
    }
    return { x: 0, y: BOARD_HEIGHT_CLIPS - height };
  }

  protected observeCardHeights(elements: readonly ElementRef<HTMLElement>[]): void {
    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const wrapper = (entry.target as HTMLElement).closest<HTMLElement>('.clip-card');
        const pinId = wrapper?.dataset['pinId'];
        if (!pinId) continue;
        const heightClips = Math.max(
          1,
          Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height) / CLIP_SIZE_PX,
        );
        this.reportMeasuredHeight(pinId, Math.ceil(heightClips));
      }
    });
    for (const element of elements) {
      const card = element.nativeElement.querySelector<HTMLElement>('.pin-card');
      if (card) this.resizeObserver.observe(card);
    }
  }

  protected reportMeasuredHeight(pinId: string, heightClips: number): void {
    if (!this.canEdit() || this.measuredHeights.get(pinId) === heightClips) return;
    this.measuredHeights.set(pinId, heightClips);
    const pin = this.pins().find((item) => item.id === pinId);
    if (!pin || pin.grid.heightClips === heightClips) return;
    const grid: UpdateGridBlockRequest = {
      x: pin.grid.x,
      y: this.clamp(pin.grid.y, 0, BOARD_HEIGHT_CLIPS - heightClips),
      heightClips,
      layer: pin.grid.layer,
    };
    if (this.dropAllowed(pinId, grid)) this.onGridChange.emit({ pinId, grid });
  }

  protected setSettledGrid(pinId: string, grid: UpdateGridBlockRequest): void {
    this.settledGrids.update((items) => ({ ...items, [pinId]: grid }));
    setTimeout(
      () =>
        this.settledGrids.update((items) => {
          const next = { ...items };
          delete next[pinId];
          return next;
        }),
      450,
    );
  }

  protected showRejectedDrop(pinId: string): void {
    if (this.rejectedTimer) clearTimeout(this.rejectedTimer);
    this.rejectedPinId.set(pinId);
    this.rejectedTimer = setTimeout(() => this.rejectedPinId.set(null), 520);
  }

  protected toUpdate(grid: GridBlock): UpdateGridBlockRequest {
    return { x: grid.x, y: grid.y, heightClips: grid.heightClips, layer: grid.layer };
  }

  protected clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
