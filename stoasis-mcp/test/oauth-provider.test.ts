import type { Response as ExpressResponse } from "express";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoasisOAuthProvider } from "../src/auth/provider.js";
import { loadConfig } from "../src/config.js";
import { SecretBox } from "../src/crypto.js";
import { MemoryOAuthStorage } from "../src/storage/memory.js";

class MockResponse {
  statusCode = 200;
  body = "";
  redirectUrl = "";
  headers: Record<string, string> = {};

  status(code: number) {
    this.statusCode = code;
    return this;
  }
  set(headers: Record<string, string>) {
    Object.assign(this.headers, headers);
    return this;
  }
  send(body: string) {
    this.body = body;
    return this;
  }
  redirect(status: number, url: string) {
    this.statusCode = status;
    this.redirectUrl = url;
    return this;
  }
}

const client: OAuthClientInformationFull = {
  client_id: "chatgpt-client",
  client_id_issued_at: 1,
  redirect_uris: ["https://chatgpt.com/connector/oauth/callback"],
  token_endpoint_auth_method: "none",
  client_name: "ChatGPT",
};

afterEach(() => vi.unstubAllGlobals());

describe("StoasisOAuthProvider", () => {
  it("links a Stoasis login to rotating OAuth bearer tokens", async () => {
    const config = loadConfig({
      NODE_ENV: "test",
      PUBLIC_BASE_URL: "http://localhost:3000",
      STOASIS_API_BASE_URL: "http://localhost:4000",
      SESSION_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
    });
    const storage = new MemoryOAuthStorage();
    await storage.initialize();
    await storage.saveClient(client);
    const provider = new StoasisOAuthProvider(
      config,
      storage,
      new SecretBox(config.sessionEncryptionKey),
    );

    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url.endsWith("/api/auth/login")) {
        return new Response(
          JSON.stringify({
            user: { id: "user-1", email: "sam@example.com", name: "Sam" },
            expiresAt: "2026-09-17T10:00:00Z",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie": "stoasis_session=session-secret; HttpOnly; Path=/",
            },
          },
        );
      }
      if (url.endsWith("/api/auth/me")) {
        return new Response(
          JSON.stringify({
            id: "user-1",
            email: "sam@example.com",
            name: "Sam",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }
      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const authorizeResponse = new MockResponse();
    await provider.authorize(
      client,
      {
        state: "state-1",
        scopes: ["stoasis:read", "stoasis:write"],
        codeChallenge: "challenge-1",
        redirectUri: client.redirect_uris[0] as string,
        resource: config.resourceUrl,
      },
      authorizeResponse as unknown as ExpressResponse,
    );
    const transactionId = hidden(authorizeResponse.body, "transaction_id");
    const csrfToken = hidden(authorizeResponse.body, "csrf_token");
    expect(authorizeResponse.headers["Content-Security-Policy"]).toContain(
      "form-action 'self' https://chatgpt.com",
    );

    const loginResponse = new MockResponse();
    await provider.completeAuthorization(
      {
        transactionId,
        csrfToken,
        email: "sam@example.com",
        password: "correct horse",
      },
      loginResponse as unknown as ExpressResponse,
    );
    const callback = new URL(loginResponse.redirectUrl);
    const code = callback.searchParams.get("code") as string;
    expect(callback.searchParams.get("state")).toBe("state-1");
    expect(await provider.challengeForAuthorizationCode(client, code)).toBe(
      "challenge-1",
    );

    const tokens = await provider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      client.redirect_uris[0],
      config.resourceUrl,
    );
    const auth = await provider.verifyAccessToken(tokens.access_token);
    expect(auth.extra?.stoasisSession).toBe("stoasis_session=session-secret");
    expect(auth.extra?.stoasisUser).toEqual({
      id: "user-1",
      email: "sam@example.com",
      name: "Sam",
    });

    const refreshed = await provider.exchangeRefreshToken(
      client,
      tokens.refresh_token as string,
      ["stoasis:read"],
      config.resourceUrl,
    );
    expect(refreshed.access_token).not.toBe(tokens.access_token);
    await expect(
      provider.exchangeRefreshToken(
        client,
        tokens.refresh_token as string,
        undefined,
        config.resourceUrl,
      ),
    ).rejects.toThrow(/invalid or expired/i);
  });
});

function hidden(html: string, name: string): string {
  const match = html.match(new RegExp(`name="${name}" value="([^"]+)"`));
  if (!match?.[1]) throw new Error(`Missing hidden field ${name}`);
  return match[1];
}
