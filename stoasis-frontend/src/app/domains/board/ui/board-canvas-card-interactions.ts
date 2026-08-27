import { Directive } from '@angular/core';
import { Pin } from '../../../shared/models/pin';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { BoardCanvasLayout } from './board-canvas-layout';

@Directive()
export abstract class BoardCanvasCardInteractions extends BoardCanvasLayout {
  cardLeft(pin: Pin): number {
    const active = this.drag();
    if (active?.pinId === pin.id) return active.leftPx;
    return (this.settledGrids()[pin.id]?.x ?? pin.grid.x) * CLIP_SIZE_PX;
  }

  cardTop(pin: Pin): number {
    const active = this.drag();
    if (active?.pinId === pin.id) return active.topPx;
    return (this.settledGrids()[pin.id]?.y ?? pin.grid.y) * CLIP_SIZE_PX;
  }

  cardHeight(pin: Pin): number {
    const active = this.drag();
    const heightClips =
      active?.pinId === pin.id
        ? active.origin.heightClips
        : (this.settledGrids()[pin.id]?.heightClips ?? pin.grid.heightClips);
    return heightClips * CLIP_SIZE_PX;
  }

  cardLayer(pin: Pin): number {
    const active = this.drag();
    if (active?.pinId === pin.id) return active.layer;
    return this.settledGrids()[pin.id]?.layer ?? pin.grid.layer;
  }

  layerDepth(pin: Pin): number {
    return Math.min(10, Math.max(0, this.cardLayer(pin)));
  }

  layerShadowY(pin: Pin): string {
    return `${2 + this.layerDepth(pin) * 0.16}px`;
  }

  layerShadowBlur(pin: Pin): string {
    return `${7 + this.layerDepth(pin) * 0.42}px`;
  }

  isDragging(pinId: string): boolean {
    return this.drag()?.pinId === pinId && this.drag()?.moved === true;
  }

  isInvalidDrag(pinId: string): boolean {
    const active = this.drag();
    return active?.pinId === pinId && active.moved && active.invalid;
  }

  startDrag(event: PointerEvent, pin: Pin): void {
    if (!this.canEdit() || event.button !== 0) return;
    const layer = this.maxLayer() + 1;
    this.drag.set({
      pointerId: event.pointerId,
      pinId: pin.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin: this.toUpdate(pin.grid),
      leftPx: pin.grid.x * CLIP_SIZE_PX,
      topPx: pin.grid.y * CLIP_SIZE_PX,
      layer,
      moved: false,
      invalid: false,
      stackTarget: null,
    });
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  moveDrag(event: PointerEvent): void {
    const active = this.drag();
    if (!active || active.pointerId !== event.pointerId) return;
    const screenDeltaX = event.clientX - active.startClientX;
    const screenDeltaY = event.clientY - active.startClientY;
    const deltaX = this.boardDelta(screenDeltaX);
    const deltaY = this.boardDelta(screenDeltaY);
    const moved = active.moved || Math.hypot(screenDeltaX, screenDeltaY) >= 8;
    if (!moved) return;
    event.preventDefault();
    const next = {
      ...active,
      leftPx: active.origin.x * CLIP_SIZE_PX + deltaX,
      topPx: active.origin.y * CLIP_SIZE_PX + deltaY,
      moved,
    };
    next.stackTarget = this.findStackTarget(active.pinId, this.snapCandidate(next));
    next.invalid = !next.stackTarget && !this.dropAllowed(active.pinId, this.snapCandidate(next));
    this.drag.set(next);
  }

  endDrag(event: PointerEvent): void {
    const active = this.drag();
    if (!active || active.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (!active.moved) {
      this.drag.set(null);
      this.suppressedOpenPinId = active.pinId;
      this.onSelectPin.emit(active.pinId);
      setTimeout(() => (this.suppressedOpenPinId = null));
      return;
    }

    event.preventDefault();
    this.suppressedOpenPinId = active.pinId;
    setTimeout(() => (this.suppressedOpenPinId = null));
    const candidate = this.snapCandidate(active);
    if (active.stackTarget) {
      this.onStackDrop.emit({
        pinId: active.pinId,
        targetId: active.stackTarget.id,
        targetType: active.stackTarget.type,
      });
      this.drag.set(null);
      return;
    }
    const accepted = this.dropAllowed(active.pinId, candidate);
    const grid = accepted ? candidate : { ...active.origin, layer: active.layer };

    if (!accepted) this.showRejectedDrop(active.pinId);
    this.setSettledGrid(active.pinId, grid);
    this.onGridChange.emit({ pinId: active.pinId, grid });
    this.drag.set(null);
  }

  cancelDrag(event: PointerEvent): void {
    if (this.drag()?.pointerId === event.pointerId) this.drag.set(null);
  }

  openPin(pinId: string): void {
    if (this.suppressedOpenPinId === pinId) return;
    this.onSelectPin.emit(pinId);
  }
}
