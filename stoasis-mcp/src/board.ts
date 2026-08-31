import type { AppConfig } from "./config.js";
import type { StoasisApiClient } from "./stoasis/client.js";
import type { BoardSnapshot, Pin } from "./stoasis/types.js";

export async function loadBoardSnapshot(
  client: StoasisApiClient,
  config: Pick<AppConfig, "stoasisWebBaseUrl">,
  collectionId: string,
): Promise<BoardSnapshot> {
  const [board, pins, elements] = await Promise.all([
    client.getCollection(collectionId),
    client.listPins(collectionId),
    client.getBoardElements(collectionId),
  ]);

  const stackByPinId: Record<string, string> = {};
  for (const stack of elements.stacks) {
    for (const pinId of stack.children) stackByPinId[pinId] = stack.id;
  }

  const connectorsByPinId: Record<string, string[]> = {};
  for (const connector of elements.connectors) {
    (connectorsByPinId[connector.sourcePinId] ??= []).push(connector.id);
    (connectorsByPinId[connector.targetPinId] ??= []).push(connector.id);
  }

  const occupied = occupiedBounds(
    pins,
    elements.stacks,
    elements.zones,
    elements.labels,
    elements.stickers,
  );
  const base = config.stoasisWebBaseUrl.href.endsWith("/")
    ? config.stoasisWebBaseUrl
    : new URL(`${config.stoasisWebBaseUrl.href}/`);
  const boardUrl = new URL(
    `collections/${encodeURIComponent(collectionId)}`,
    base,
  ).href;

  return {
    board: {
      ...board,
      url: boardUrl,
      canEdit:
        board.currentUserRole === "owner" || board.currentUserRole === "editor",
    },
    bounds: { widthClips: 160, heightClips: 240, occupied },
    pins,
    elements,
    relationships: {
      stackByPinId,
      unstackedPinIds: pins
        .map((pin) => pin.id)
        .filter((id) => stackByPinId[id] === undefined),
      connectorsByPinId,
    },
    counts: {
      pins: pins.length,
      stacks: elements.stacks.length,
      connectors: elements.connectors.length,
      zones: elements.zones.length,
      labels: elements.labels.length,
      stickers: elements.stickers.length,
    },
  };
}

type Rect = { x: number; y: number; width: number; height: number };

function occupiedBounds(
  pins: Pin[],
  stacks: Array<{ x: number; y: number; width: number; heightClips: number }>,
  zones: Array<{
    x: number;
    y: number;
    widthClips: number;
    heightClips: number;
  }>,
  labels: Array<{ x: number; y: number; widthClips: number }>,
  stickers: Array<{
    x: number;
    y: number;
    widthClips: number;
    heightClips: number;
  }>,
): BoardSnapshot["bounds"]["occupied"] {
  const rects: Rect[] = [
    ...pins.map((pin) => ({
      x: pin.grid.x,
      y: pin.grid.y,
      width: pin.grid.width,
      height: pin.grid.heightClips,
    })),
    ...stacks.map((stack) => ({
      x: stack.x,
      y: stack.y,
      width: stack.width,
      height: stack.heightClips,
    })),
    ...zones.map((zone) => ({
      x: zone.x,
      y: zone.y,
      width: zone.widthClips,
      height: zone.heightClips,
    })),
    ...labels.map((label) => ({
      x: label.x,
      y: label.y,
      width: label.widthClips,
      height: 4,
    })),
    ...stickers.map((sticker) => ({
      x: sticker.x,
      y: sticker.y,
      width: sticker.widthClips,
      height: sticker.heightClips,
    })),
  ];
  if (rects.length === 0) return null;
  return {
    minX: Math.min(...rects.map((rect) => rect.x)),
    minY: Math.min(...rects.map((rect) => rect.y)),
    maxX: Math.max(...rects.map((rect) => rect.x + rect.width)),
    maxY: Math.max(...rects.map((rect) => rect.y + rect.height)),
  };
}
