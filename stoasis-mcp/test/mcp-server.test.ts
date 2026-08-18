import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { createStoasisMcpServer } from "../src/mcp/server.js";

describe("Stoasis MCP contract", () => {
  it("publishes the complete spatial board toolset and board UI", async () => {
    const config = loadConfig({ NODE_ENV: "test" });
    const server = createStoasisMcpServer(config);
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name);
    expect(names).toHaveLength(29);
    expect(names).toEqual(expect.arrayContaining([
      "get_board",
      "render_board",
      "move_pin",
      "create_stack",
      "create_connector",
      "create_zone",
      "create_label",
      "create_sticker",
    ]));
    expect(tools.tools.find((tool) => tool.name === "delete_board")?.annotations?.destructiveHint).toBe(true);
    expect(tools.tools.find((tool) => tool.name === "get_board")?.annotations?.readOnlyHint).toBe(true);
    const destructiveNames = tools.tools
      .filter((tool) => tool.annotations?.destructiveHint)
      .map((tool) => tool.name)
      .sort();
    expect(destructiveNames).toEqual([
      "delete_board",
      "delete_connector",
      "delete_label",
      "delete_pin",
      "delete_sticker",
      "delete_zone",
      "dissolve_stack",
    ]);

    const resources = await client.listResources();
    expect(resources.resources.some((resource) => resource.uri === "ui://stoasis/board.html")).toBe(true);

    await client.close();
    await server.close();
  });
});
