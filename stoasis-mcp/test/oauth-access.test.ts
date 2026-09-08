import { afterEach, describe, expect, it, vi } from "vitest";
import {
  authorizeFixture,
  oauthClient,
  oauthFixture,
} from "./oauth-fixture.js";

afterEach(() => vi.unstubAllGlobals());

describe("MCP account access", () => {
  it("does not issue an authorization code to a free account", async () => {
    const { provider } = oauthFixture("free");
    const result = await authorizeFixture(provider);
    expect(result.redirectUrl).toBe("");
    expect(result.body).toContain("Premium ist erforderlich");
  });

  it("checks eligibility again before issuing tokens", async () => {
    const { provider, access } = oauthFixture();
    const authorization = await authorizeFixture(provider);
    const code = new URL(authorization.redirectUrl).searchParams.get("code")!;
    access.allowed = false;
    await expect(
      provider.exchangeAuthorizationCode(oauthClient, code),
    ).rejects.toThrow(/revoked or Premium/);
  });

  it("rejects access and refresh tokens after account revocation or downgrade", async () => {
    const { provider, access } = oauthFixture();
    const authorization = await authorizeFixture(provider);
    const code = new URL(authorization.redirectUrl).searchParams.get("code")!;
    const tokens = await provider.exchangeAuthorizationCode(oauthClient, code);
    expect(
      (await provider.verifyAccessToken(tokens.access_token)).scopes,
    ).toContain("stoasis:write");
    access.allowed = false;
    await expect(
      provider.verifyAccessToken(tokens.access_token),
    ).rejects.toThrow(/revoked or Premium/);
    await expect(
      provider.exchangeRefreshToken(oauthClient, tokens.refresh_token!),
    ).rejects.toThrow();
  });

  it("revokes every token from the same connection", async () => {
    const { provider } = oauthFixture();
    const authorization = await authorizeFixture(provider);
    const code = new URL(authorization.redirectUrl).searchParams.get("code")!;
    const tokens = await provider.exchangeAuthorizationCode(oauthClient, code);
    await provider.revokeToken(oauthClient, { token: tokens.access_token });
    await expect(
      provider.verifyAccessToken(tokens.access_token),
    ).rejects.toThrow(/invalid or expired/);
    await expect(
      provider.exchangeRefreshToken(oauthClient, tokens.refresh_token!),
    ).rejects.toThrow(/invalid or expired/);
  });
});
