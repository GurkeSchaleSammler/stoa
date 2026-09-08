import type { Response } from "express";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import {
  InvalidGrantError,
  InvalidRequestError,
  InvalidScopeError,
  InvalidTargetError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AppConfig } from "../config.js";
import { hashSecret, randomToken, SecretBox } from "../crypto.js";
import type {
  OAuthStorage,
  PendingAuthorization,
  StoredToken,
} from "../storage/types.js";
import {
  StoasisApiClient,
  StoasisApiError,
  type StoasisLogin,
} from "../stoasis/client.js";

export const READ_SCOPE = "stoasis:read";
export const WRITE_SCOPE = "stoasis:write";
export const SUPPORTED_SCOPES = [READ_SCOPE, WRITE_SCOPE] as const;

type LoginInput = {
  transactionId: string;
  csrfToken: string;
  email: string;
  password: string;
};

/** Issues scoped OAuth grants backed by revocable premium sessions. */
export class StoasisOAuthProvider implements OAuthServerProvider {
  readonly clientsStore: OAuthRegisteredClientsStore;

  constructor(
    private readonly config: AppConfig,
    private readonly storage: OAuthStorage,
    private readonly secretBox: SecretBox,
  ) {
    this.clientsStore = {
      getClient: (clientId) => this.storage.getClient(clientId),
      registerClient: async (client) => {
        const registered = client as OAuthClientInformationFull;
        await this.storage.saveClient(registered);
        return registered;
      },
    };
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    const resource = params.resource ?? this.config.resourceUrl;
    this.assertResource(resource);
    const scopes = this.normalizeScopes(params.scopes);
    const transactionId = randomToken();
    const csrfToken = randomToken();
    const storedParams = {
      scopes,
      codeChallenge: params.codeChallenge,
      redirectUri: params.redirectUri,
      resource: resource.href,
      ...(params.state !== undefined ? { state: params.state } : {}),
    };
    const pending: PendingAuthorization = {
      id: transactionId,
      csrfHash: hashSecret(csrfToken),
      clientId: client.client_id,
      clientName: client.client_name || "ChatGPT",
      params: storedParams,
      expiresAt: new Date(
        Date.now() + this.config.loginTransactionTtlSeconds * 1_000,
      ),
    };
    await this.storage.savePendingAuthorization(pending);
    this.sendLoginPage(res, pending, csrfToken);
  }

  async completeAuthorization(input: LoginInput, res: Response): Promise<void> {
    const csrfHash = hashSecret(input.csrfToken);
    const pending = await this.storage.getPendingAuthorization(
      input.transactionId,
      csrfHash,
    );
    if (!pending) {
      this.sendExpiredPage(res);
      return;
    }

    try {
      const login = await this.loginForMcp(input);
      const consumed = await this.storage.consumePendingAuthorization(
        input.transactionId,
        csrfHash,
      );
      if (!consumed) {
        this.sendExpiredPage(res);
        return;
      }
      await this.finishAuthorization(consumed, login, res);
    } catch (error) {
      this.sendLoginPage(
        res,
        pending,
        input.csrfToken,
        this.loginError(error),
        input.email,
      );
    }
  }

  private async loginForMcp(input: LoginInput): Promise<StoasisLogin> {
    const login = await new StoasisApiClient(this.config).login(
      input.email.trim(),
      input.password,
    );
    const session = new StoasisApiClient(this.config, login.sessionCookie);
    try {
      if (login.user.plan !== "premium")
        throw new StoasisApiError(403, "Premium erforderlich.");
      await session.connectMcp();
      return login;
    } catch (error) {
      await session.logout().catch(() => undefined);
      throw error;
    }
  }

  private async finishAuthorization(
    pending: PendingAuthorization,
    login: StoasisLogin,
    res: Response,
  ): Promise<void> {
    const code = randomToken();
    await this.storage.saveAuthorizationCode({
      codeHash: hashSecret(code),
      clientId: pending.clientId,
      params: pending.params,
      encryptedSession: this.secretBox.encrypt(login.sessionCookie),
      user: {
        id: login.user.id,
        email: login.user.email,
        name: login.user.name,
      },
      expiresAt: new Date(Date.now() + this.config.authCodeTtlSeconds * 1_000),
    });
    const redirect = new URL(pending.params.redirectUri);
    redirect.searchParams.set("code", code);
    if (pending.params.state !== undefined)
      redirect.searchParams.set("state", pending.params.state);
    res.redirect(302, redirect.href);
  }

  private loginError(error: unknown): string {
    if (error instanceof StoasisApiError && error.status === 401)
      return "E-Mail oder Passwort ist nicht korrekt.";
    if (error instanceof StoasisApiError && error.status === 403)
      return "Premium ist erforderlich, um Stoasis mit ChatGPT zu verbinden.";
    return "Die Anmeldung ist momentan nicht möglich. Bitte versuche es erneut.";
  }

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const code = await this.storage.getAuthorizationCode(
      hashSecret(authorizationCode),
      client.client_id,
    );
    if (!code)
      throw new InvalidGrantError("Authorization code is invalid or expired.");
    return code.params.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
    resource?: URL,
  ): Promise<OAuthTokens> {
    const code = await this.storage.consumeAuthorizationCode(
      hashSecret(authorizationCode),
      client.client_id,
    );
    if (!code)
      throw new InvalidGrantError("Authorization code is invalid or expired.");
    if (redirectUri && redirectUri !== code.params.redirectUri) {
      throw new InvalidGrantError(
        "redirect_uri does not match the authorization request.",
      );
    }
    this.assertStoredResource(code.params.resource, resource);
    return this.issueTokens({
      clientId: client.client_id,
      scopes: code.params.scopes,
      resource: code.params.resource,
      encryptedSession: code.encryptedSession,
      user: code.user,
    });
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL,
  ): Promise<OAuthTokens> {
    const stored = await this.storage.consumeRefreshToken(
      hashSecret(refreshToken),
      client.client_id,
    );
    if (!stored)
      throw new InvalidGrantError("Refresh token is invalid or expired.");
    this.assertStoredResource(stored.resource, resource);

    const requestedScopes = scopes
      ? this.normalizeScopes(scopes)
      : stored.scopes;
    if (requestedScopes.some((scope) => !stored.scopes.includes(scope))) {
      throw new InvalidScopeError(
        "Requested scope exceeds the original grant.",
      );
    }

    return this.issueTokens({
      clientId: stored.clientId,
      scopes: requestedScopes,
      ...(stored.resource ? { resource: stored.resource } : {}),
      encryptedSession: stored.encryptedSession,
      user: stored.user,
    });
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const stored = await this.storage.getAccessToken(hashSecret(token));
    if (!stored)
      throw new InvalidTokenError("Access token is invalid or expired.");
    if (stored.resource !== this.config.resourceUrl.href) {
      throw new InvalidTokenError("Access token has an invalid audience.");
    }
    try {
      await new StoasisApiClient(
        this.config,
        this.secretBox.decrypt(stored.encryptedSession),
      ).authorizeMcp();
    } catch {
      throw new InvalidTokenError(
        "MCP access was revoked or Premium is required. Reconnect Stoasis.",
      );
    }
    return {
      token,
      clientId: stored.clientId,
      scopes: stored.scopes,
      expiresAt: Math.floor(stored.expiresAt.getTime() / 1_000),
      resource: new URL(stored.resource),
      extra: {
        stoasisSession: this.secretBox.decrypt(stored.encryptedSession),
        stoasisUser: stored.user,
      },
    };
  }

  async revokeToken(
    client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest,
  ): Promise<void> {
    await this.storage.revokeToken(hashSecret(request.token), client.client_id);
  }

  private normalizeScopes(requested?: string[]): string[] {
    const scopes =
      requested && requested.length > 0
        ? [...new Set(requested)]
        : [...SUPPORTED_SCOPES];
    if (
      scopes.some(
        (scope) =>
          !SUPPORTED_SCOPES.includes(
            scope as (typeof SUPPORTED_SCOPES)[number],
          ),
      )
    ) {
      throw new InvalidScopeError("Unknown Stoasis scope.");
    }
    return scopes;
  }

  private assertResource(resource: URL): void {
    const normalized = new URL(resource.href);
    normalized.hash = "";
    if (normalized.href !== this.config.resourceUrl.href) {
      throw new InvalidTargetError("Unknown MCP resource.");
    }
  }

  private assertStoredResource(
    stored: string | undefined,
    requested?: URL,
  ): void {
    if (!stored || stored !== this.config.resourceUrl.href) {
      throw new InvalidGrantError(
        "Authorization grant has an invalid resource.",
      );
    }
    if (requested && requested.href !== stored) {
      throw new InvalidGrantError(
        "resource does not match the authorization request.",
      );
    }
  }

  private async issueTokens(
    source: Omit<StoredToken, "tokenHash" | "tokenType" | "expiresAt">,
  ): Promise<OAuthTokens> {
    try {
      await new StoasisApiClient(
        this.config,
        this.secretBox.decrypt(source.encryptedSession),
      ).authorizeMcp();
    } catch {
      throw new InvalidGrantError(
        "MCP access was revoked or Premium is required.",
      );
    }
    const accessToken = randomToken();
    const refreshToken = randomToken();
    const now = Date.now();
    await this.storage.saveToken({
      ...source,
      tokenHash: hashSecret(accessToken),
      tokenType: "access",
      expiresAt: new Date(now + this.config.accessTokenTtlSeconds * 1_000),
    });
    await this.storage.saveToken({
      ...source,
      tokenHash: hashSecret(refreshToken),
      tokenType: "refresh",
      expiresAt: new Date(now + this.config.refreshTokenTtlSeconds * 1_000),
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: this.config.accessTokenTtlSeconds,
      scope: source.scopes.join(" "),
    };
  }

  private sendLoginPage(
    res: Response,
    pending: PendingAuthorization,
    csrfToken: string,
    error?: string,
    email = "",
  ): void {
    const scopeText = pending.params.scopes.includes(WRITE_SCOPE)
      ? "Boards ansehen und in deinem Namen bearbeiten"
      : "Boards ansehen";
    sendHtml(
      res,
      200,
      `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stoasis mit ${escapeHtml(pending.clientName)} verbinden</title>
<style>
:root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f4f1e8;color:#26352d}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#e3eadc,#f4f1e8 50%)}
main{width:min(100%,430px);background:#fffdf7;border:1px solid #d8d5c8;border-radius:24px;padding:30px;box-shadow:0 22px 70px #33443b20}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.mark{display:grid;place-items:center;width:46px;height:46px;border-radius:15px;background:#506b59;color:white;font-size:24px}
h1{font-size:23px;margin:0 0 8px;line-height:1.25}p{margin:0 0 22px;color:#607066;line-height:1.5}.permission{background:#edf2e9;border-radius:14px;padding:13px 15px;margin-bottom:20px;font-size:14px}
label{display:block;font-size:14px;font-weight:650;margin:14px 0 6px}input{width:100%;padding:13px 14px;border:1px solid #c9cec7;border-radius:12px;background:white;color:#26352d;font:inherit}input:focus{outline:3px solid #8da89455;border-color:#617c69}
button{width:100%;margin-top:20px;border:0;border-radius:12px;padding:14px 16px;background:#506b59;color:white;font:inherit;font-weight:750;cursor:pointer}button:hover{background:#405b49}.error{background:#fff0ed;color:#9c352d;padding:12px 14px;border-radius:12px;margin-bottom:12px;font-size:14px}
small{display:block;margin-top:16px;color:#78837b;line-height:1.45}@media(prefers-color-scheme:dark){:root{background:#17201b;color:#eef3ed}body{background:#17201b}main{background:#222d26;border-color:#3d4a41}.permission{background:#2d3b31}p,small{color:#b7c2ba}input{background:#17201b;color:#eef3ed;border-color:#526158}}
</style></head><body><main>
<div class="brand"><div class="mark">◌</div><strong>Stoasis</strong></div>
<h1>${escapeHtml(pending.clientName)} verbinden</h1>
<p>Melde dich mit deinem bestehenden Stoasis-Konto an.</p>
<div class="permission">Erlaubnis: ${escapeHtml(scopeText)}</div>
${error ? `<div class="error" role="alert">${escapeHtml(error)}</div>` : ""}
<form method="post" action="${escapeHtml(new URL("oauth/login", this.config.publicBaseUrl).pathname)}">
<input type="hidden" name="transaction_id" value="${escapeHtml(pending.id)}">
<input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}">
<label for="email">E-Mail</label><input id="email" name="email" type="email" value="${escapeHtml(email)}" autocomplete="username" required autofocus>
<label for="password">Passwort</label><input id="password" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Sicher verbinden</button>
</form><small>Dein Passwort wird nur zur Anmeldung an Stoasis verwendet und nicht im MCP-Dienst gespeichert.</small>
</main></body></html>`,
      [new URL(pending.params.redirectUri).origin],
    );
  }

  private sendExpiredPage(res: Response): void {
    sendHtml(
      res,
      400,
      '<!doctype html><html lang="de"><meta charset="utf-8"><title>Verbindung abgelaufen</title><body><main><h1>Verbindung abgelaufen</h1><p>Starte die Verbindung in ChatGPT bitte erneut.</p></main></body></html>',
    );
  }
}

function sendHtml(
  res: Response,
  status: number,
  body: string,
  formRedirectOrigins: string[] = [],
): void {
  const formAction = ["'self'", ...formRedirectOrigins].join(" ");
  res
    .status(status)
    .set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; form-action ${formAction}; base-uri 'none'; frame-ancestors 'none'`,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    })
    .send(body);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] as string;
  });
}
