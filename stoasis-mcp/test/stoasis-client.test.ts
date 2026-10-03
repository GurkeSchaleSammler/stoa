import { afterEach, describe, expect, it, vi } from "vitest";
import { StoasisApiClient } from "../src/stoasis/client.js";

describe("StoasisApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks authenticated backend requests as server-side MCP traffic", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new StoasisApiClient(
      {
        stoasisApiBaseUrl: new URL("http://backend:4000"),
        stoasisSessionCookie: "stoasis_session",
        stoasisRequestTimeoutMs: 1_000,
      },
      "stoasis_session=session-secret",
    );

    await client.connectMcp();

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(request.headers);
    expect(headers.get("X-Stoasis-Client")).toBe("mcp");
    expect(headers.get("Cookie")).toBe("stoasis_session=session-secret");
  });
});
