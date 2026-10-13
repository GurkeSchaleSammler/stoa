import { Directive } from '@angular/core';
import { Pin } from '../../../shared/models/pin';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { CARD_WIDTH_CLIPS } from '../data/models/card-width-clips';
import { BOARD_WIDTH_CLIPS } from '../data/models/board-width-clips';
import { BOARD_HEIGHT_CLIPS } from '../data/models/board-height-clips';
import { PinResizeEdge, PinResizeState } from './models/pin-resize-state';
import { UpdateGridBlockRequest } from '../data/models/update-grid-block-request';
import { BoardCanvasLayout } from './board-canvas-layout';

@Directive()
export abstract class BoardCanvasCardInteractions extends BoardCanvasLayout {
  readonly resizeEdges: PinResizeEdge[] = ['left', 'right', 'top', 'bottom'];
  cardLeft(pin: Pin): number {
    if (this.pinResize()?.pinId === pin.id) return this.pinResize()!.grid.x * CLIP_SIZE_PX;
    const active = this.drag();
    if (active?.pinId === pin.id) return active.leftPx;
    return (this.settledGrids()[pin.id]?.x ?? pin.grid.x) * CLIP_SIZE_PX;
  }

  cardTop(pin: Pin): number {
    if (this.pinResize()?.pinId === pin.id) return this.pinResize()!.grid.y * CLIP_SIZE_PX;
    const active = this.drag();
    if (active?.pinId === pin.id) return active.topPx;
    return (this.settledGrids()[pin.id]?.y ?? pin.grid.y) * CLIP_SIZE_PX;
  }

  cardHeight(pin: Pin): number {
    if (this.pinResize()?.pinId === pin.id)
      return this.pinResize()!.grid.heightClips * CLIP_SIZE_PX;
    const active = this.drag();
    const heightClips =
      active?.pinId === pin.id
        ? active.origin.heightClips
        : (this.settledGrids()[pin.id]?.heightClips ?? pin.grid.heightClips);
    return heightClips * CLIP_SIZE_PX;
  }

  cardWidth(pin: Pin): number {
    return (
      (this.pinResize()?.pinId === pin.id
        ? this.pinResize()!.grid.width!
        : (this.settledGrids()[pin.id]?.width ?? pin.grid.width)) * CLIP_SIZE_PX
    );
  }

  isResizing(pinId: string): boolean {
    return this.pinResize()?.pinId === pinId;
  }

  hasManualSize(pin: Pin): boolean {
    return (
      this.isResizing(pin.id) ||
      (this.settledGrids()[pin.id]?.manualSize ?? pin.grid.manualSize ?? false)
    );
  }

  startPinResize(event: PointerEvent, pin: Pin, edge: PinResizeEdge): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const origin = this.toUpdate(pin.grid);
    this.pinResize.set({
      pointerId: event.pointerId,
      pinId: pin.id,
      edge,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin,
      grid: { ...origin, manualSize: true },
      baseHeightClips: pin.grid.baseHeightClips ?? pin.grid.heightClips,
      moved: false,
      invalid: false,
    });
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  movePinResize(event: PointerEvent): void {
    const active = this.pinResize();
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = Math.round(this.boardDelta(event.clientX - active.startClientX) / CLIP_SIZE_PX);
    const dy = Math.round(this.boardDelta(event.clientY - active.startClientY) / CLIP_SIZE_PX);
    const grid = this.resizedGrid(active, dx, dy);
    const moved =
      grid.width !== active.origin.width || grid.heightClips !== active.origin.heightClips;
    this.pinResize.set({ ...active, grid, moved, invalid: !this.dropAllowed(active.pinId, grid) });
  }

  private resizedGrid(active: PinResizeState, dx: number, dy: number): UpdateGridBlockRequest {
    const origin = active.origin;
    const grid = { ...origin, manualSize: true };
    if (active.edge === 'left' || active.edge === 'right') {
      const right = origin.x + origin.width!;
      const available = active.edge === 'left' ? right : BOARD_WIDTH_CLIPS - origin.x;
      grid.width = this.clamp(
        origin.width! + (active.edge === 'left' ? -dx : dx),
        CARD_WIDTH_CLIPS,
        Math.min(CARD_WIDTH_CLIPS * 2, available),
      );
      if (active.edge === 'left') grid.x = right - grid.width;
    } else {
      const bottom = origin.y + origin.heightClips;
      const available = active.edge === 'top' ? bottom : BOARD_HEIGHT_CLIPS - origin.y;
      grid.heightClips = this.clamp(
        origin.heightClips + (active.edge === 'top' ? -dy : dy),
        active.baseHeightClips,
        Math.min(active.baseHeightClips * 2, available),
      );
      if (active.edge === 'top') grid.y = bottom - grid.heightClips;
    }
    return grid;
  }

  resizePinFromKeyboard(event: KeyboardEvent, pin: Pin, edge: PinResizeEdge): void {
    if (!this.canEdit()) return;
    const horizontal = edge === 'left' || edge === 'right';
    const keys = horizontal ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const origin = this.toUpdate(pin.grid);
    const grid = this.resizedGrid(
      {
        pointerId: 0,
        pinId: pin.id,
        edge,
        startClientX: 0,
        startClientY: 0,
        origin,
        grid: origin,
        baseHeightClips: pin.grid.baseHeightClips ?? pin.grid.heightClips,
        moved: false,
        invalid: false,
      },
      event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0,
      event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0,
    );
    if (grid.width === origin.width && grid.heightClips === origin.heightClips) return;
    if (this.dropAllowed(pin.id, grid)) {
      this.setSettledGrid(pin.id, grid);
      this.onGridChange.emit({ pinId: pin.id, grid });
    } else {
      this.showRejectedDrop(pin.id);
    }
  }

  endPinResize(event: PointerEvent): void {
    const active = this.pinResize();
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (active.moved) {
      if (this.dropAllowed(active.pinId, active.grid)) {
        this.setSettledGrid(active.pinId, active.grid);
        this.onGridChange.emit({ pinId: active.pinId, grid: active.grid });
      } else {
        this.showRejectedDrop(active.pinId);
      }
    }
    this.pinResize.set(null);
  }

  cancelPinResize(event: PointerEvent): void {
    event.stopPropagation();
    if (this.pinResize()?.pointerId === event.pointerId) this.pinResize.set(null);
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
    if (this.pinResize()?.pinId === pinId) return this.pinResize()!.invalid;
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
