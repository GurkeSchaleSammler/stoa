import { Directive } from '@angular/core';
import { Pin } from '../../../shared/models/pin';
import { ConnectorThread } from '../data/models/connector-thread';
import { StackBlock } from '../data/models/stack-block';
import { BoardCanvasCardInteractions } from './board-canvas-card-interactions';
import { ConnectorDraft } from './models/connector-draft';
import { StackTarget } from './models/stack-target';

@Directive()
export abstract class BoardCanvasConnectorInteractions extends BoardCanvasCardInteractions {
  startConnector(event: PointerEvent, pin: Pin): void {
    if (!this.canEdit() || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget as HTMLElement;
    const card = handle.closest<HTMLElement>('.clip-card');
    const board = handle.closest<HTMLElement>('.clip-board');
    if (!card || !board) return;
    const cardRect = card.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const startX = this.boardDelta(cardRect.right - boardRect.left);
    const startY = this.boardDelta(cardRect.top + cardRect.height / 2 - boardRect.top);
    handle.setPointerCapture?.(event.pointerId);
    this.connectorDraft.set({
      pointerId: event.pointerId,
      sourcePinId: pin.id,
      startX,
      startY,
      endX: startX,
      endY: startY,
      boardLeft: boardRect.left,
      boardTop: boardRect.top,
    });
  }

  moveConnector(event: PointerEvent): void {
    const draft = this.connectorDraft();
    if (!draft || draft.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    this.connectorDraft.set({
      ...draft,
      endX: this.boardDelta(event.clientX - draft.boardLeft),
      endY: this.boardDelta(event.clientY - draft.boardTop),
    });
  }

  endConnector(event: PointerEvent): void {
    const draft = this.connectorDraft();
    if (!draft || draft.pointerId !== event.pointerId) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-pin-id]');
    const targetPinId = target?.dataset['pinId'];
    if (targetPinId && targetPinId !== draft.sourcePinId) {
      this.onCreateConnector.emit({
        sourcePinId: draft.sourcePinId,
        targetPinId,
        color: this.selectedColor(),
      });
    }
    const currentTarget = event.currentTarget as HTMLElement;
    if (currentTarget.hasPointerCapture?.(event.pointerId)) {
      currentTarget.releasePointerCapture(event.pointerId);
    }
    this.connectorDraft.set(null);
  }

  cancelConnector(event: PointerEvent): void {
    if (this.connectorDraft()?.pointerId === event.pointerId) this.connectorDraft.set(null);
  }

  connectorPath(connector: ConnectorThread): string {
    const source = this.pinAnchor(connector.sourcePinId);
    const target = this.pinAnchor(connector.targetPinId);
    return this.curvePath(source.x, source.y, target.x, target.y);
  }

  selectConnector(event: Event, connector: ConnectorThread): void {
    if (!this.canEdit()) return;
    event.stopPropagation();
    this.selectedConnectorId.set(connector.id);
  }

  connectorEditorLeft(connector: ConnectorThread): number {
    const source = this.pinAnchor(connector.sourcePinId);
    const target = this.pinAnchor(connector.targetPinId);
    return this.clamp((source.x + target.x) / 2 - 125, 0, this.boardWidthPx - 250);
  }

  connectorEditorTop(connector: ConnectorThread): number {
    const source = this.pinAnchor(connector.sourcePinId);
    const target = this.pinAnchor(connector.targetPinId);
    return this.clamp((source.y + target.y) / 2 - 74, 0, this.boardHeightPx - 128);
  }

  changeConnectorColor(connectorId: string, color: string): void {
    this.onUpdateConnector.emit({ id: connectorId, color });
  }

  draftConnectorPath(draft: ConnectorDraft): string {
    return this.curvePath(draft.startX, draft.startY, draft.endX, draft.endY);
  }

  pinById(pinId: string): Pin | null {
    return this.pins().find((pin) => pin.id === pinId) ?? null;
  }

  topPin(stack: StackBlock): Pin | null {
    return this.pinById(stack.children.at(-1) ?? '');
  }

  isStackTarget(type: StackTarget['type'], id: string): boolean {
    const target = this.drag()?.stackTarget;
    return target?.type === type && target.id === id;
  }
}
