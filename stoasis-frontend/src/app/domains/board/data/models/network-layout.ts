import { Pin } from '../../../../shared/models/pin';
import { ConnectorThread } from './connector-thread';

export interface NetworkNode {
  pin: Pin;
  x: number;
  y: number;
}
/** Deterministic breadth-first layers, including isolated and stacked pins. O(V + E). */
export function networkLayout(pins: Pin[], connectors: ConnectorThread[]): NetworkNode[] {
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  const neighbours = new Map(pins.map((pin) => [pin.id, new Set<string>()]));
  for (const edge of connectors) {
    if (!byId.has(edge.sourcePinId) || !byId.has(edge.targetPinId)) continue;
    neighbours.get(edge.sourcePinId)!.add(edge.targetPinId);
    neighbours.get(edge.targetPinId)!.add(edge.sourcePinId);
  }
  const visited = new Set<string>();
  const nodes: NetworkNode[] = [];
  let offsetX = 40,
    offsetY = 40,
    rowHeight = 0;
  for (const root of pins) {
    if (visited.has(root.id)) continue;
    const component: NetworkNode[] = [];
    const queue = [{ id: root.id, depth: 0 }];
    const rows = new Map<number, number>();
    visited.add(root.id);
    for (let i = 0; i < queue.length; i++) {
      const { id, depth } = queue[i];
      const row = rows.get(depth) ?? 0;
      rows.set(depth, row + 1);
      component.push({ pin: byId.get(id)!, x: depth * 300, y: row * 112 });
      for (const next of neighbours.get(id)!)
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ id: next, depth: depth + 1 });
        }
    }
    const componentWidth = Math.max(...component.map((node) => node.x)) + 260;
    const componentHeight = Math.max(...rows.values()) * 112;
    if (offsetX > 40 && offsetX + componentWidth > 1200) {
      offsetX = 40;
      offsetY += rowHeight + 40;
      rowHeight = 0;
    }
    nodes.push(...component.map((node) => ({ ...node, x: node.x + offsetX, y: node.y + offsetY })));
    offsetX += componentWidth + 40;
    rowHeight = Math.max(rowHeight, componentHeight);
  }
  return nodes;
}
