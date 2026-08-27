import { Directive } from '@angular/core';
import { Pin } from '../../../shared/models/pin';
import { BOARD_HEIGHT_CLIPS } from '../data/models/board-height-clips';
import { BOARD_WIDTH_CLIPS } from '../data/models/board-width-clips';
import { CARD_WIDTH_CLIPS } from '../data/models/card-width-clips';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { StackBlock } from '../data/models/stack-block';
import { BoardCanvasStickerInteractions } from './board-canvas-sticker-interactions';

@Directive()
export abstract class BoardCanvasStackInteractions extends BoardCanvasStickerInteractions {
  startStackPointer(event: PointerEvent, stack: StackBlock): void {
    if (!this.canEdit() || event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.stackDrag.set({
      pointerId: event.pointerId,
      stackId: stack.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: stack.x,
      originY: stack.y,
      leftPx: stack.x * CLIP_SIZE_PX,
      topPx: stack.y * CLIP_SIZE_PX,
      layer: this.maxLayer() + 1,
      moved: false,
      invalid: false,
    });
  }

  moveStackPointer(event: PointerEvent): void {
    const state = this.stackDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    const screenDeltaX = event.clientX - state.startClientX;
    const screenDeltaY = event.clientY - state.startClientY;
    const deltaX = this.boardDelta(screenDeltaX);
    const deltaY = this.boardDelta(screenDeltaY);
    const moved = state.moved || Math.hypot(screenDeltaX, screenDeltaY) >= 4;
    if (!moved) return;
    event.preventDefault();
    const next = {
      ...state,
      leftPx: state.originX * CLIP_SIZE_PX + deltaX,
      topPx: state.originY * CLIP_SIZE_PX + deltaY,
      moved,
      invalid: false,
    };
    const stack = this.elements().stacks.find((item) => item.id === state.stackId);
    if (stack) next.invalid = !this.stackDropAllowed(stack, this.snapStack(next, stack));
    this.stackDrag.set(next);
  }

  endStackPointer(event: PointerEvent, stack: StackBlock): void {
    const state = this.stackDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (state.moved) {
      const snapped = this.snapStack(state, stack);
      if (this.stackDropAllowed(stack, snapped)) {
        this.onStackChange.emit({ id: stack.id, update: { ...snapped, layer: state.layer } });
      } else {
        this.showRejectedDrop(stack.id);
      }
    }
    this.stackDrag.set(null);
  }

  cancelStackPointer(event: PointerEvent): void {
    if (this.stackDrag()?.pointerId === event.pointerId) this.stackDrag.set(null);
  }

  stackLeft(stack: StackBlock): number {
    const state = this.stackDrag();
    return state?.stackId === stack.id ? state.leftPx : stack.x * CLIP_SIZE_PX;
  }

  stackTop(stack: StackBlock): number {
    const state = this.stackDrag();
    return state?.stackId === stack.id ? state.topPx : stack.y * CLIP_SIZE_PX;
  }

  stackLayer(stack: StackBlock): number {
    const state = this.stackDrag();
    return state?.stackId === stack.id ? state.layer : stack.layer;
  }

  startStackChildPointer(event: PointerEvent, stack: StackBlock, pin: Pin): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.stackChildDrag.set({
      pointerId: event.pointerId,
      stackId: stack.id,
      pinId: pin.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      moved: false,
    });
  }

  moveStackChildPointer(event: PointerEvent): void {
    const state = this.stackChildDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const screenDeltaX = event.clientX - state.startClientX;
    const screenDeltaY = event.clientY - state.startClientY;
    const deltaX = this.boardDelta(screenDeltaX);
    const deltaY = this.boardDelta(screenDeltaY);
    this.stackChildDrag.set({
      ...state,
      deltaX,
      deltaY,
      moved: state.moved || Math.hypot(screenDeltaX, screenDeltaY) >= 6,
    });
  }

  endStackChildPointer(event: PointerEvent, stack: StackBlock, pin: Pin): void {
    const state = this.stackChildDrag();
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (state.moved) {
      this.suppressedOpenPinId = pin.id;
      setTimeout(() => (this.suppressedOpenPinId = null));
      this.onReleaseStackChild.emit({
        stackId: stack.id,
        pinId: pin.id,
        x: this.clamp(
          stack.x + Math.round(state.deltaX / CLIP_SIZE_PX),
          0,
          BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS,
        ),
        y: this.clamp(
          stack.y + Math.round(state.deltaY / CLIP_SIZE_PX),
          0,
          BOARD_HEIGHT_CLIPS - pin.grid.heightClips,
        ),
        layer: this.maxLayer() + 1,
      });
    }
    this.stackChildDrag.set(null);
  }

  cancelStackChildPointer(event: PointerEvent): void {
    if (this.stackChildDrag()?.pointerId === event.pointerId) this.stackChildDrag.set(null);
  }

  stackChildTransform(stack: StackBlock, pinId: string, index: number): string {
    const state = this.stackChildDrag();
    const fanX = index * 34;
    const fanY = (index % 2) * 22;
    const rotation = index % 2 === 0 ? -1.2 : 1.2;
    if (state?.stackId === stack.id && state.pinId === pinId) {
      return `translate(${fanX + state.deltaX}px, ${fanY + state.deltaY}px) rotate(${rotation}deg)`;
    }
    return `translate(${fanX}px, ${fanY}px) rotate(${rotation}deg)`;
  }
}
