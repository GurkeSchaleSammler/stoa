import type { Response as ExpressResponse } from "express";
import { vi } from "vitest";
import { StoasisOAuthProvider } from "../src/auth/provider.js";
import { loadConfig } from "../src/config.js";
import { SecretBox } from "../src/crypto.js";
import { MemoryOAuthStorage } from "../src/storage/memory.js";

export const oauthClient = {
  client_id: "feature-client",
  client_id_issued_at: 1,
  redirect_uris: ["https://chatgpt.com/connector/oauth/callback"],
  token_endpoint_auth_method: "none" as const,
  client_name: "ChatGPT",
};

/** Captures authorization pages and redirects without an HTTP server. */
export class OAuthResponse {
  body = "";
  redirectUrl = "";
  status(): this {
    return this;
  }
  set(): this {
    return this;
  }
  send(body: string): this {
    this.body = body;
    return this;
  }
  redirect(_status: number, url: string): this {
    this.redirectUrl = url;
    return this;
  }
  asResponse(): ExpressResponse {
    return this as unknown as ExpressResponse;
  }
}

/** Creates an OAuth provider with controllable backend eligibility. */
export function oauthFixture(plan: string | undefined = "premium") {
  const config = loadConfig({ NODE_ENV: "test" });
  const storage = new MemoryOAuthStorage();
  const access = { allowed: true };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url.endsWith("/api/auth/login")) return loginResponse(plan);
      if (url.endsWith("/api/auth/logout"))
        return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ eligible: access.allowed }), {
        status: access.allowed ? 200 : 403,
        headers: { "content-type": "application/json" },
      });
    }),
  );
  const provider = new StoasisOAuthProvider(
    config,
    storage,
    new SecretBox(config.sessionEncryptionKey),
  );
  return { config, storage, access, provider };
}

export async function authorizeFixture(
  provider: StoasisOAuthProvider,
): Promise<OAuthResponse> {
  const page = new OAuthResponse();
  await provider.authorize(
    oauthClient,
    {
      scopes: ["stoasis:read", "stoasis:write"],
      codeChallenge: "challenge",
      redirectUri: oauthClient.redirect_uris[0]!,
    },
    page.asResponse(),
  );
  const hidden = (name: string) =>
    page.body.match(new RegExp(`name="${name}" value="([^"]+)"`))![1]!;
  const result = new OAuthResponse();
  await provider.completeAuthorization(
    {
      transactionId: hidden("transaction_id"),
      csrfToken: hidden("csrf_token"),
      email: "test@example.com",
      password: "test-password",
    },
    result.asResponse(),
  );
  return result;
}

function loginResponse(plan: string | undefined): Response {
  return new Response(
    JSON.stringify({
      user: { id: "test-user", email: "test@example.com", name: "Test", plan },
      expiresAt: "2099-01-01T00:00:00Z",
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": "stoasis_session=test-session; HttpOnly; Path=/",
      },
    },
  );
}
