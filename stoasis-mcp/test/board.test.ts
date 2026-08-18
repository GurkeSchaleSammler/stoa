import { describe, expect, it } from "vitest";
import { loadBoardSnapshot } from "../src/board.js";
import type { StoasisApiClient } from "../src/stoasis/client.js";

describe("loadBoardSnapshot", () => {
  it("combines pins and board elements into spatial relationships", async () => {
    const client = {
      getCollection: async () => ({
        id: "board-1",
        name: "Ideas",
        emoji: "🌿",
        allowedTypes: ["note"],
        visibility: "private",
        pinCount: 2,
        members: [],
        updatedAt: "2026-08-18T10:00:00Z",
        ownerId: "user-1",
        currentUserRole: "owner",
      }),
      listPins: async () => [
        {
          id: "pin-1",
          collectionId: "board-1",
          createdBy: "user-1",
          createdByName: "Sam",
          sortOrder: 1,
          tags: [],
          comments: [],
          createdAt: "2026-08-18T10:00:00Z",
          type: "note",
          data: { content: "One" },
          grid: { id: "pin-1", x: 4, y: 6, width: 16, heightClips: 12, layer: 1, contentType: "note" },
        },
        {
          id: "pin-2",
          collectionId: "board-1",
          createdBy: "user-1",
          createdByName: "Sam",
          sortOrder: 2,
          tags: [],
          comments: [],
          createdAt: "2026-08-18T10:00:00Z",
          type: "note",
          data: { content: "Two" },
          grid: { id: "pin-2", x: 24, y: 6, width: 16, heightClips: 12, layer: 2, contentType: "note" },
        },
      ],
      getBoardElements: async () => ({
        stacks: [{ id: "stack-1", type: "stack", x: 24, y: 6, width: 16, heightClips: 12, layer: 3, children: ["pin-2"], expanded: false }],
        connectors: [{ id: "thread-1", sourcePinId: "pin-1", targetPinId: "pin-2", colorVariant: "accent" }],
        zones: [],
        labels: [],
        stickers: [],
      }),
    } as unknown as StoasisApiClient;

    const snapshot = await loadBoardSnapshot(
      client,
      { stoasisWebBaseUrl: new URL("https://stoasis.example/") },
      "board-1",
    );

    expect(snapshot.board.canEdit).toBe(true);
    expect(snapshot.board.url).toBe("https://stoasis.example/collections/board-1");
    expect(snapshot.relationships.stackByPinId).toEqual({ "pin-2": "stack-1" });
    expect(snapshot.relationships.unstackedPinIds).toEqual(["pin-1"]);
    expect(snapshot.relationships.connectorsByPinId["pin-2"]).toEqual(["thread-1"]);
    expect(snapshot.bounds.occupied).toEqual({ minX: 4, minY: 6, maxX: 40, maxY: 18 });
  });
});
