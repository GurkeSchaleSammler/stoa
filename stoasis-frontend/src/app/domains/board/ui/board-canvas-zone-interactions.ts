import { BOARD_HEIGHT_CLIPS } from '../data/models/board-height-clips';
import { BOARD_WIDTH_CLIPS } from '../data/models/board-width-clips';
import { CLIP_SIZE_PX } from '../data/models/clip-size-px';
import { FloatingLabel } from '../data/models/floating-label';
import { SoftZone } from '../data/models/soft-zone';
import { BoardCanvasConnectorInteractions } from './board-canvas-connector-interactions';

@Directive()
export abstract class BoardCanvasZoneInteractions extends BoardCanvasConnectorInteractions {
  toggleZoneTool(): void {
    this.activeTool.update((tool) => (tool === 'zone' ? null : 'zone'));
  }

  startBoardPointer(event: PointerEvent): void {
    if (!this.canEdit() || this.activeTool() !== 'zone' || event.target !== event.currentTarget)
      return;
    const board = event.currentTarget as HTMLElement;
    const rect = board.getBoundingClientRect();
    const x = this.clamp(
      Math.floor((event.clientX - rect.left) / CLIP_SIZE_PX),
      0,
      BOARD_WIDTH_CLIPS - 2,
    );
    const y = this.clamp(
      Math.floor((event.clientY - rect.top) / CLIP_SIZE_PX),
      0,
      BOARD_HEIGHT_CLIPS - 2,
    );
    event.preventDefault();
    board.setPointerCapture?.(event.pointerId);
    this.zonePointer.set({
      pointerId: event.pointerId,
      zoneId: null,
      mode: 'draw',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: x,
      startY: y,
      x,
      y,
      widthClips: 2,
      heightClips: 2,
    });
  }

  startZonePointer(event: PointerEvent, zone: SoftZone, mode: 'move' | 'resize'): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.zonePointer.set({
      pointerId: event.pointerId,
      zoneId: zone.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: zone.x,
      startY: zone.y,
      x: zone.x,
      y: zone.y,
      widthClips: zone.widthClips,
      heightClips: zone.heightClips,
    });
  }

  moveBoardPointer(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) {
      this.moveConnector(event);
      return;
    }
    const state = this.zonePointer();
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = Math.round((event.clientX - state.startClientX) / CLIP_SIZE_PX);
    const deltaY = Math.round((event.clientY - state.startClientY) / CLIP_SIZE_PX);
    if (state.mode === 'draw') {
      const currentX = this.clamp(state.startX + deltaX, 0, BOARD_WIDTH_CLIPS - 1);
      const currentY = this.clamp(state.startY + deltaY, 0, BOARD_HEIGHT_CLIPS - 1);
      const x = Math.min(state.startX, currentX);
      const y = Math.min(state.startY, currentY);
      this.zonePointer.set({
        ...state,
        x,
        y,
        widthClips: Math.max(
          2,
          Math.min(BOARD_WIDTH_CLIPS - x, Math.abs(currentX - state.startX) + 1),
        ),
        heightClips: Math.max(
          2,
          Math.min(BOARD_HEIGHT_CLIPS - y, Math.abs(currentY - state.startY) + 1),
        ),
      });
      return;
    }
    if (state.mode === 'move') {
      this.zonePointer.set({
        ...state,
        x: this.clamp(state.startX + deltaX, 0, BOARD_WIDTH_CLIPS - state.widthClips),
        y: this.clamp(state.startY + deltaY, 0, BOARD_HEIGHT_CLIPS - state.heightClips),
      });
      return;
    }
    this.zonePointer.set({
      ...state,
      widthClips: this.clamp(state.widthClips + deltaX, 2, BOARD_WIDTH_CLIPS - state.x),
      heightClips: this.clamp(state.heightClips + deltaY, 2, BOARD_HEIGHT_CLIPS - state.y),
      startClientX: event.clientX,
      startClientY: event.clientY,
    });
  }

  endBoardPointer(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) {
      this.endConnector(event);
      return;
    }
    const state = this.zonePointer();
    if (!state || state.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    const geometry = {
      x: state.x,
      y: state.y,
      widthClips: state.widthClips,
      heightClips: state.heightClips,
    };
    if (state.mode === 'draw') {
      this.onCreateZone.emit({
        ...geometry,
        colorVariant: this.selectedColor(),
        label: this.newZoneLabel().trim() || null,
      });
      this.activeTool.set(null);
    } else if (state.zoneId) {
      this.onUpdateZone.emit({ id: state.zoneId, update: geometry });
    }
    this.zonePointer.set(null);
  }

  cancelBoardPointer(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) {
      this.cancelConnector(event);
      return;
    }
    if (this.zonePointer()?.pointerId === event.pointerId) this.zonePointer.set(null);
  }

  zoneX(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.x : zone.x;
  }

  zoneY(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.y : zone.y;
  }

  zoneWidth(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.widthClips : zone.widthClips;
  }

  zoneHeight(zone: SoftZone): number {
    const state = this.zonePointer();
    return state?.zoneId === zone.id ? state.heightClips : zone.heightClips;
  }

  addFloatingLabel(): void {
    const text = this.newLabelText().trim();
    if (!text) return;
    const index = this.elements().labels.length;
    this.onCreateLabel.emit({
      x: 2 + (index % 8) * 7,
      y: 2 + Math.floor(index / 8) * 4,
      widthClips: 6,
      text,
      layer: this.maxLayer() + 1,
    });
    this.newLabelText.set('');
  }

  startLabelPointer(event: PointerEvent, label: FloatingLabel): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.labelPointer.set({
      pointerId: event.pointerId,
      labelId: label.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: label.x,
      originY: label.y,
      x: label.x,
      y: label.y,
    });
  }

  moveLabelPointer(event: PointerEvent): void {
    const state = this.labelPointer();
    if (!state || state.pointerId !== event.pointerId) return;
    const label = this.elements().labels.find((item) => item.id === state.labelId);
    if (!label) return;
    event.preventDefault();
    this.labelPointer.set({
      ...state,
      x: this.clamp(
        state.originX + Math.round((event.clientX - state.startClientX) / CLIP_SIZE_PX),
        0,
        BOARD_WIDTH_CLIPS - label.widthClips,
      ),
      y: this.clamp(
        state.originY + Math.round((event.clientY - state.startClientY) / CLIP_SIZE_PX),
        0,
        BOARD_HEIGHT_CLIPS - 2,
      ),
    });
  }

  endLabelPointer(event: PointerEvent): void {
    const state = this.labelPointer();
    if (!state || state.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    this.onUpdateLabel.emit({
      id: state.labelId,
      update: { x: state.x, y: state.y, layer: this.maxLayer() + 1 },
    });
    this.labelPointer.set(null);
  }

  cancelLabelPointer(event: PointerEvent): void {
    if (this.labelPointer()?.pointerId === event.pointerId) this.labelPointer.set(null);
  }

  labelValue(label: FloatingLabel): Pick<FloatingLabel, 'x' | 'y'> {
    const state = this.labelPointer();
    return state?.labelId === label.id ? state : label;
  }
}
import { Directive } from '@angular/core';
