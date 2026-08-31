import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadBoardSnapshot } from "../board.js";
import type { AppConfig } from "../config.js";
import { READ_SCOPE, WRITE_SCOPE } from "../auth/provider.js";
import { StoasisApiClient, StoasisApiError } from "../stoasis/client.js";
import { BOARD_UI_HTML, BOARD_UI_URI } from "./board-ui.js";

const id = z.string().trim().min(1).max(128);
const pinType = z.enum(["link", "note", "photo", "skill"]);
const visibility = z.enum(["private", "link", "public"]);
const color = z.enum(["accent", "sage", "clay", "ink", "amber"]);
const motif = z.enum([
  "circle",
  "triangle",
  "moon",
  "blob",
  "star",
  "wave",
  "arrow",
  "leaf",
  "cloud",
  "drop",
  "compass",
  "suitcase",
  "camera",
]);
const x = z.number().int().min(0).max(159);
const pinX = z.number().int().min(0).max(144);
const y = z.number().int().min(0).max(239);
const layer = z.number().int().min(0).max(1_000_000);
const height = z.number().int().min(1).max(240);
const tags = z.array(z.string().trim().min(1).max(80)).max(50).default([]);
const pinData = z.union([
  z.object({
    url: z.string().url().max(4_096),
    title: z.string().max(500).optional(),
    description: z.string().max(5_000).nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    siteName: z.string().max(300).nullable().optional(),
    readingTimeMin: z.number().int().min(0).max(10_000).nullable().optional(),
    parseStatus: z.string().max(80).optional(),
  }),
  z.object({
    content: z.string().trim().min(1).max(50_000),
    color: z.enum(["yellow", "blue", "green"]).default("yellow"),
  }),
  z.object({
    fileKey: z.string().trim().min(1).max(500),
    caption: z.string().max(5_000).nullable().optional(),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    imageUrl: z.string().nullable().optional(),
  }),
  z.object({
    skillName: z.string().trim().min(1).max(120),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
    yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  }),
]);

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;
const write = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
} as const;
const destructive = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
} as const;

type ToolExtra = { authInfo?: AuthInfo };

export function createStoasisMcpServer(config: AppConfig): McpServer {
  const server = new McpServer(
    { name: "stoasis", version: "1.0.0" },
    {
      instructions:
        "Stoasis is a spatial board, not a flat pin list. Call get_board before layout changes to inspect coordinates, layers, stacks, connectors, zones, labels and stickers. Use render_board when the user wants to see the board. Confirm destructive actions with the user.",
    },
  );

  server.registerResource(
    "stoasis-board-ui",
    BOARD_UI_URI,
    {
      description: "Visual, spatial Stoasis board",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: BOARD_UI_URI,
          mimeType: "text/html;profile=mcp-app",
          text: BOARD_UI_HTML,
          _meta: { ui: { prefersBorder: true } },
        },
      ],
    }),
  );

  server.registerTool(
    "list_boards",
    {
      title: "Stoasis boards list",
      description:
        "List the Stoasis boards/collections the signed-in user can access, including role and pin count.",
      inputSchema: {
        filter: z.enum(["all", "owned", "shared"]).default("all"),
      },
      annotations: readOnly,
    },
    async ({ filter }, extra) =>
      withApi(config, extra, READ_SCOPE, async (client) => {
        const boards = await client.listCollections(filter);
        return result({ boards }, `${boards.length} Stoasis-Boards gefunden.`);
      }),
  );

  server.registerTool(
    "get_board",
    {
      title: "Stoasis board read",
      description:
        "Read one complete spatial board snapshot: board metadata, pins with grid coordinates, stacks, connectors, zones, labels, stickers, layers and derived relationships. Call this before changing layout.",
      inputSchema: { collectionId: id.describe("Board/collection ID") },
      annotations: readOnly,
    },
    async ({ collectionId }, extra) =>
      withApi(config, extra, READ_SCOPE, async (client) => {
        const snapshot = await loadBoardSnapshot(client, config, collectionId);
        return result(
          { snapshot },
          `Board „${snapshot.board.name}“: ${snapshot.counts.pins} Pins, ${snapshot.counts.stacks} Stacks und ${snapshot.counts.connectors} Verbindungen.`,
        );
      }),
  );

  server.registerTool(
    "render_board",
    {
      title: "Stoasis board show",
      description:
        "Render a visual spatial Stoasis board in ChatGPT. Use after get_board when the user asks to see, inspect or visually review a board.",
      inputSchema: { collectionId: id.describe("Board/collection ID") },
      annotations: readOnly,
      _meta: {
        ui: { resourceUri: BOARD_UI_URI },
        "openai/toolInvocation/invoking": "Board wird aufgebaut …",
        "openai/toolInvocation/invoked": "Board ist bereit.",
      },
    },
    async ({ collectionId }, extra) =>
      withApi(config, extra, READ_SCOPE, async (client) => {
        const snapshot = await loadBoardSnapshot(client, config, collectionId);
        return result(
          { snapshot },
          `Das räumliche Board „${snapshot.board.name}“ wird angezeigt.`,
        );
      }),
  );

  server.registerTool(
    "search_pins",
    {
      title: "Stoasis pins search",
      description:
        "Search accessible Stoasis pins across boards by text, optional pin type and optional tag.",
      inputSchema: {
        query: z.string().max(500).default(""),
        type: pinType.optional(),
        tag: z.string().trim().min(1).max(80).optional(),
      },
      annotations: readOnly,
    },
    async ({ query, type, tag }, extra) =>
      withApi(config, extra, READ_SCOPE, async (client) => {
        const pins = await client.search(query, type, tag);
        return result({ pins }, `${pins.length} passende Pins gefunden.`);
      }),
  );

  server.registerTool(
    "preview_link",
    {
      title: "Link preview fetch",
      description:
        "Safely fetch link metadata through Stoasis before creating a link pin. The backend enforces its SSRF and image-safety policy.",
      inputSchema: { url: z.string().url().max(4_096) },
      annotations: { ...readOnly, openWorldHint: true },
    },
    async ({ url }, extra) =>
      withApi(config, extra, READ_SCOPE, async (client) => {
        const preview = await client.previewLink(url);
        return result({ preview }, "Link-Vorschau wurde sicher geladen.");
      }),
  );

  server.registerTool(
    "create_board",
    {
      title: "Stoasis board create",
      description: "Create a new Stoasis board with the allowed pin types.",
      inputSchema: {
        name: z.string().trim().min(1).max(120),
        emoji: z.string().trim().min(1).max(16).default("📌"),
        allowedTypes: z
          .array(pinType)
          .min(1)
          .max(4)
          .default(["link", "note", "photo"]),
      },
      annotations: write,
    },
    async ({ name, emoji, allowedTypes }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const board = await client.createCollection({
          name,
          emoji,
          allowedTypes,
        });
        return result({ board }, `Board „${name}“ wurde erstellt.`);
      }),
  );

  server.registerTool(
    "update_board",
    {
      title: "Stoasis board update",
      description:
        "Update a board's name, emoji, visibility or allowed pin types.",
      inputSchema: {
        collectionId: id,
        name: z.string().trim().min(1).max(120).optional(),
        emoji: z.string().trim().min(1).max(16).optional(),
        visibility: visibility.optional(),
        allowedTypes: z.array(pinType).min(1).max(4).optional(),
      },
      annotations: write,
    },
    async ({ collectionId, ...changes }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const board = await client.updateCollection(
          collectionId,
          defined(changes),
        );
        return result({ board }, "Board-Einstellungen wurden aktualisiert.");
      }),
  );

  server.registerTool(
    "delete_board",
    {
      title: "Stoasis board delete",
      description:
        "Permanently delete a Stoasis board. Only use after explicit user confirmation.",
      inputSchema: { collectionId: id },
      annotations: destructive,
    },
    async ({ collectionId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        await client.deleteCollection(collectionId);
        return result(
          { deleted: true, collectionId },
          "Board wurde endgültig gelöscht.",
        );
      }),
  );

  server.registerTool(
    "create_pin",
    {
      title: "Stoasis pin create",
      description:
        "Create a pin on a board. For link pins call preview_link first and pass its metadata. Data fields: link {url,title,description?,imageUrl?,siteName?,readingTimeMin?,parseStatus?}; note {content,color}; photo {fileKey,caption?,width,height,imageUrl?}; skill {skillName,level,yearsExperience?}.",
      inputSchema: {
        collectionId: id,
        type: pinType,
        data: pinData,
        tags,
      },
      annotations: write,
    },
    async ({ collectionId, type, data, tags: pinTags }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const pin = await client.createPin(collectionId, {
          type,
          data,
          tags: pinTags,
        });
        return result(
          { pin },
          `${kindName(type)}-Pin wurde bei (${pin.grid.x}, ${pin.grid.y}) erstellt.`,
        );
      }),
  );

  server.registerTool(
    "update_pin",
    {
      title: "Stoasis pin update",
      description:
        "Update a pin's content data, tags or list sort order without changing its board coordinates. Use move_pin for geometry.",
      inputSchema: {
        collectionId: id,
        pinId: id,
        data: z.record(z.string(), z.unknown()).optional(),
        tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
        sortOrder: z.number().int().min(0).optional(),
      },
      annotations: write,
    },
    async ({ collectionId, pinId, ...changes }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const pin = await client.updatePin(
          collectionId,
          pinId,
          defined(changes),
        );
        return result({ pin }, "Pin wurde aktualisiert.");
      }),
  );

  server.registerTool(
    "move_pin",
    {
      title: "Stoasis pin move",
      description:
        "Move/resize a solo pin on the 160×240 clip board and set its layer. Read get_board first. Stacked pins must be released or their stack moved instead.",
      inputSchema: {
        collectionId: id,
        pinId: id,
        x: pinX,
        y,
        heightClips: height,
        layer,
      },
      annotations: write,
    },
    async ({ collectionId, pinId, ...grid }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const pin = await client.updatePin(collectionId, pinId, { grid });
        return result(
          { pin },
          `Pin wurde nach (${grid.x}, ${grid.y}) verschoben.`,
        );
      }),
  );

  server.registerTool(
    "delete_pin",
    {
      title: "Stoasis pin delete",
      description:
        "Permanently delete a pin and update any containing stack. Only use after user confirmation.",
      inputSchema: { collectionId: id, pinId: id },
      annotations: destructive,
    },
    async ({ collectionId, pinId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        await client.deletePin(collectionId, pinId);
        return result(
          { deleted: true, pinId },
          "Pin wurde endgültig gelöscht.",
        );
      }),
  );

  server.registerTool(
    "add_pin_comment",
    {
      title: "Stoasis pin comment",
      description: "Add a comment to a Stoasis pin as the signed-in user.",
      inputSchema: {
        collectionId: id,
        pinId: id,
        body: z.string().trim().min(1).max(5_000),
      },
      annotations: write,
    },
    async ({ collectionId, pinId, body }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const comment = await client.addComment(collectionId, pinId, body);
        return result({ comment }, "Kommentar wurde hinzugefügt.");
      }),
  );

  server.registerTool(
    "create_stack",
    {
      title: "Stoasis stack create",
      description:
        "Create a spatial stack from two currently unstacked pins. The stack appears at the target pin position.",
      inputSchema: { collectionId: id, sourcePinId: id, targetPinId: id },
      annotations: write,
    },
    async ({ collectionId, sourcePinId, targetPinId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const stack = await client.createStack(
          collectionId,
          sourcePinId,
          targetPinId,
        );
        return result(
          { stack },
          `Stack mit ${stack.children.length} Pins wurde erstellt.`,
        );
      }),
  );

  server.registerTool(
    "add_pin_to_stack",
    {
      title: "Stoasis stack add pin",
      description: "Add an unstacked pin to an existing stack.",
      inputSchema: { collectionId: id, stackId: id, pinId: id },
      annotations: write,
    },
    async ({ collectionId, stackId, pinId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const stack = await client.addPinToStack(collectionId, stackId, pinId);
        return result(
          { stack },
          `Pin wurde zum Stack hinzugefügt; der Stack enthält jetzt ${stack.children.length} Pins.`,
        );
      }),
  );

  server.registerTool(
    "update_stack",
    {
      title: "Stoasis stack update",
      description:
        "Move a stack, change its layer, or expand/collapse it. Read get_board first.",
      inputSchema: {
        collectionId: id,
        stackId: id,
        x: pinX.optional(),
        y: y.optional(),
        layer: layer.optional(),
        expanded: z.boolean().optional(),
      },
      annotations: write,
    },
    async ({ collectionId, stackId, ...changes }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const stack = await client.updateStack(
          collectionId,
          stackId,
          defined(changes),
        );
        return result({ stack }, "Stack wurde aktualisiert.");
      }),
  );

  server.registerTool(
    "release_pin_from_stack",
    {
      title: "Stoasis stack release pin",
      description:
        "Release one pin from a stack and place it at explicit board coordinates and layer.",
      inputSchema: {
        collectionId: id,
        stackId: id,
        pinId: id,
        x: pinX,
        y,
        layer,
      },
      annotations: write,
    },
    async (
      {
        collectionId,
        stackId,
        pinId,
        x: targetX,
        y: targetY,
        layer: targetLayer,
      },
      extra,
    ) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const elements = await client.releasePinFromStack(
          collectionId,
          stackId,
          {
            pinId,
            x: targetX,
            y: targetY,
            layer: targetLayer,
          },
        );
        return result(
          { elements },
          `Pin wurde bei (${targetX}, ${targetY}) aus dem Stack gelöst.`,
        );
      }),
  );

  server.registerTool(
    "dissolve_stack",
    {
      title: "Stoasis stack dissolve",
      description:
        "Dissolve a stack and restore its pins to their former positions. Pins are not deleted.",
      inputSchema: { collectionId: id, stackId: id },
      annotations: destructive,
    },
    async ({ collectionId, stackId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const elements = await client.dissolveStack(collectionId, stackId);
        return result(
          { elements },
          "Stack wurde aufgelöst; die Pins bleiben erhalten.",
        );
      }),
  );

  server.registerTool(
    "create_connector",
    {
      title: "Stoasis connector create",
      description:
        "Create a visual relationship line between two different pins.",
      inputSchema: {
        collectionId: id,
        sourcePinId: id,
        targetPinId: id,
        colorVariant: color.default("accent"),
      },
      annotations: write,
    },
    async ({ collectionId, sourcePinId, targetPinId, colorVariant }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const connector = await client.createConnector(collectionId, {
          sourcePinId,
          targetPinId,
          colorVariant,
        });
        return result(
          { connector },
          "Verbindung zwischen den Pins wurde erstellt.",
        );
      }),
  );

  server.registerTool(
    "delete_connector",
    {
      title: "Stoasis connector delete",
      description:
        "Delete one visual connector. The connected pins remain unchanged.",
      inputSchema: { collectionId: id, connectorId: id },
      annotations: destructive,
    },
    async ({ collectionId, connectorId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        await client.deleteConnector(collectionId, connectorId);
        return result(
          { deleted: true, connectorId },
          "Verbindung wurde entfernt.",
        );
      }),
  );

  server.registerTool(
    "create_zone",
    {
      title: "Stoasis zone create",
      description:
        "Create a colored rectangular zone behind board content to group a spatial area.",
      inputSchema: {
        collectionId: id,
        x,
        y,
        widthClips: z.number().int().min(1).max(160),
        heightClips: height,
        colorVariant: color.default("sage"),
        label: z.string().trim().max(80).optional(),
      },
      annotations: write,
    },
    async ({ collectionId, ...zone }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const created = await client.createDecoration(
          collectionId,
          "zones",
          defined(zone),
        );
        return result({ zone: created }, "Board-Zone wurde erstellt.");
      }),
  );

  server.registerTool(
    "update_zone",
    {
      title: "Stoasis zone update",
      description: "Move, resize, recolor or relabel a board zone.",
      inputSchema: {
        collectionId: id,
        zoneId: id,
        x: x.optional(),
        y: y.optional(),
        widthClips: z.number().int().min(1).max(160).optional(),
        heightClips: height.optional(),
        colorVariant: color.optional(),
        label: z.string().trim().max(80).optional(),
      },
      annotations: write,
    },
    async ({ collectionId, zoneId, ...changes }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const zone = await client.updateDecoration(
          collectionId,
          "zones",
          zoneId,
          defined(changes),
        );
        return result({ zone }, "Board-Zone wurde aktualisiert.");
      }),
  );

  server.registerTool(
    "delete_zone",
    {
      title: "Stoasis zone delete",
      description:
        "Delete a board zone. Pins within the area remain unchanged.",
      inputSchema: { collectionId: id, zoneId: id },
      annotations: destructive,
    },
    async ({ collectionId, zoneId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        await client.deleteDecoration(collectionId, "zones", zoneId);
        return result({ deleted: true, zoneId }, "Board-Zone wurde entfernt.");
      }),
  );

  server.registerTool(
    "create_label",
    {
      title: "Stoasis label create",
      description: "Place a free-floating text label at board coordinates.",
      inputSchema: {
        collectionId: id,
        x,
        y,
        widthClips: z.number().int().min(1).max(160).default(4),
        text: z.string().trim().min(1).max(120),
        layer,
      },
      annotations: write,
    },
    async ({ collectionId, ...label }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const created = await client.createDecoration(
          collectionId,
          "labels",
          label,
        );
        return result({ label: created }, "Freies Board-Label wurde erstellt.");
      }),
  );

  server.registerTool(
    "update_label",
    {
      title: "Stoasis label update",
      description: "Move, resize, edit or relayer a free-floating board label.",
      inputSchema: {
        collectionId: id,
        labelId: id,
        x: x.optional(),
        y: y.optional(),
        widthClips: z.number().int().min(1).max(160).optional(),
        text: z.string().trim().min(1).max(120).optional(),
        layer: layer.optional(),
      },
      annotations: write,
    },
    async ({ collectionId, labelId, ...changes }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const label = await client.updateDecoration(
          collectionId,
          "labels",
          labelId,
          defined(changes),
        );
        return result({ label }, "Board-Label wurde aktualisiert.");
      }),
  );

  server.registerTool(
    "delete_label",
    {
      title: "Stoasis label delete",
      description: "Delete a free-floating board label.",
      inputSchema: { collectionId: id, labelId: id },
      annotations: destructive,
    },
    async ({ collectionId, labelId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        await client.deleteDecoration(collectionId, "labels", labelId);
        return result(
          { deleted: true, labelId },
          "Board-Label wurde entfernt.",
        );
      }),
  );

  server.registerTool(
    "create_sticker",
    {
      title: "Stoasis sticker create",
      description: "Place a decorative sticker on the spatial board.",
      inputSchema: {
        collectionId: id,
        motif,
        colorVariant: color,
        x: z.number().min(0).max(160),
        y: z.number().min(0).max(240),
        widthClips: z.number().min(0.5).max(160).default(4),
        heightClips: z.number().min(0.5).max(240).default(4),
        rotation: z.number().min(-360).max(360).default(0),
        layer,
      },
      annotations: write,
    },
    async ({ collectionId, ...sticker }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const created = await client.createDecoration(
          collectionId,
          "stickers",
          sticker,
        );
        return result({ sticker: created }, "Board-Sticker wurde erstellt.");
      }),
  );

  server.registerTool(
    "update_sticker",
    {
      title: "Stoasis sticker update",
      description:
        "Move, resize, rotate, recolor, relayer or change a board sticker motif.",
      inputSchema: {
        collectionId: id,
        stickerId: id,
        motif: motif.optional(),
        colorVariant: color.optional(),
        x: z.number().min(0).max(160).optional(),
        y: z.number().min(0).max(240).optional(),
        widthClips: z.number().min(0.5).max(160).optional(),
        heightClips: z.number().min(0.5).max(240).optional(),
        rotation: z.number().min(-360).max(360).optional(),
        layer: layer.optional(),
      },
      annotations: write,
    },
    async ({ collectionId, stickerId, ...changes }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        const sticker = await client.updateDecoration(
          collectionId,
          "stickers",
          stickerId,
          defined(changes),
        );
        return result({ sticker }, "Board-Sticker wurde aktualisiert.");
      }),
  );

  server.registerTool(
    "delete_sticker",
    {
      title: "Stoasis sticker delete",
      description: "Delete a decorative board sticker.",
      inputSchema: { collectionId: id, stickerId: id },
      annotations: destructive,
    },
    async ({ collectionId, stickerId }, extra) =>
      withApi(config, extra, WRITE_SCOPE, async (client) => {
        await client.deleteDecoration(collectionId, "stickers", stickerId);
        return result(
          { deleted: true, stickerId },
          "Board-Sticker wurde entfernt.",
        );
      }),
  );

  return server;
}

async function withApi(
  config: AppConfig,
  extra: ToolExtra,
  requiredScope: string,
  operation: (client: StoasisApiClient) => Promise<CallToolResult>,
): Promise<CallToolResult> {
  try {
    const auth = extra.authInfo;
    if (!auth)
      throw new ToolAccessError("Keine gültige MCP-Anmeldung vorhanden.");
    if (!auth.scopes.includes(requiredScope)) {
      throw new ToolAccessError(`Die Berechtigung ${requiredScope} fehlt.`);
    }
    const session = auth.extra?.stoasisSession;
    if (typeof session !== "string" || !session) {
      throw new ToolAccessError(
        "Die Stoasis-Sitzung fehlt. Bitte verbinde den MCP erneut.",
      );
    }
    return await operation(new StoasisApiClient(config, session));
  } catch (error) {
    const message = toolErrorMessage(error);
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}

function result(
  structuredContent: Record<string, unknown>,
  text: string,
): CallToolResult {
  return { structuredContent, content: [{ type: "text", text }] };
}

function defined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

function toolErrorMessage(error: unknown): string {
  if (error instanceof StoasisApiError) {
    if (error.status === 401)
      return "Die Stoasis-Anmeldung ist abgelaufen. Bitte verbinde den MCP in ChatGPT erneut.";
    return error.message;
  }
  if (error instanceof ToolAccessError) return error.message;
  return "Die Stoasis-Aktion konnte nicht ausgeführt werden.";
}

function kindName(type: string): string {
  return (
    (
      { link: "Link", note: "Notiz", photo: "Foto", skill: "Skill" } as Record<
        string,
        string
      >
    )[type] ?? ""
  );
}

class ToolAccessError extends Error {}
