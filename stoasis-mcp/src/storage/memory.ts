import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type {
  AuthorizationCode,
  OAuthStorage,
  PendingAuthorization,
  StoredToken,
} from "./types.js";

export class MemoryOAuthStorage implements OAuthStorage {
  private readonly clients = new Map<string, OAuthClientInformationFull>();
  private readonly pending = new Map<string, PendingAuthorization>();
  private readonly codes = new Map<string, AuthorizationCode>();
  private readonly tokens = new Map<string, StoredToken>();

  async initialize(): Promise<void> {}
  async close(): Promise<void> {}

  async getClient(
    clientId: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    return this.clients.get(clientId);
  }

  async saveClient(client: OAuthClientInformationFull): Promise<void> {
    this.clients.set(client.client_id, structuredClone(client));
  }

  async savePendingAuthorization(value: PendingAuthorization): Promise<void> {
    this.pending.set(value.id, structuredClone(value));
  }

  async consumePendingAuthorization(
    id: string,
    csrfHash: string,
  ): Promise<PendingAuthorization | undefined> {
    const value = await this.getPendingAuthorization(id, csrfHash);
    if (!value) return undefined;
    this.pending.delete(id);
    return value;
  }

  async getPendingAuthorization(
    id: string,
    csrfHash: string,
  ): Promise<PendingAuthorization | undefined> {
    const value = this.pending.get(id);
    if (!value || value.csrfHash !== csrfHash || value.expiresAt <= new Date())
      return undefined;
    return structuredClone(value);
  }

  async saveAuthorizationCode(value: AuthorizationCode): Promise<void> {
    this.codes.set(value.codeHash, structuredClone(value));
  }

  async getAuthorizationCode(
    codeHash: string,
    clientId: string,
  ): Promise<AuthorizationCode | undefined> {
    const value = this.codes.get(codeHash);
    if (!value || value.clientId !== clientId || value.expiresAt <= new Date())
      return undefined;
    return structuredClone(value);
  }

  async consumeAuthorizationCode(
    codeHash: string,
    clientId: string,
  ): Promise<AuthorizationCode | undefined> {
    const value = await this.getAuthorizationCode(codeHash, clientId);
    if (!value) return undefined;
    this.codes.delete(codeHash);
    return value;
  }

  async saveToken(value: StoredToken): Promise<void> {
    this.tokens.set(value.tokenHash, structuredClone(value));
  }

  async getAccessToken(tokenHash: string): Promise<StoredToken | undefined> {
    const value = this.tokens.get(tokenHash);
    if (
      !value ||
      value.tokenType !== "access" ||
      value.revokedAt !== undefined ||
      value.expiresAt <= new Date()
    ) {
      return undefined;
    }
    return structuredClone(value);
  }

  async consumeRefreshToken(
    tokenHash: string,
    clientId: string,
  ): Promise<StoredToken | undefined> {
    const value = this.tokens.get(tokenHash);
    if (
      !value ||
      value.tokenType !== "refresh" ||
      value.clientId !== clientId ||
      value.revokedAt !== undefined ||
      value.expiresAt <= new Date()
    ) {
      return undefined;
    }
    value.revokedAt = new Date();
    return structuredClone(value);
  }

  async revokeToken(tokenHash: string, clientId: string): Promise<void> {
    const value = this.tokens.get(tokenHash);
    if (value?.clientId !== clientId) return;
    for (const token of this.tokens.values()) {
      if (
        token.clientId === clientId &&
        token.encryptedSession === value.encryptedSession
      ) {
        token.revokedAt = new Date();
      }
    }
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [id, value] of this.pending)
      if (value.expiresAt <= now) this.pending.delete(id);
    for (const [id, value] of this.codes)
      if (value.expiresAt <= now) this.codes.delete(id);
    for (const [id, value] of this.tokens) {
      if (value.expiresAt <= now || value.revokedAt !== undefined)
        this.tokens.delete(id);
    }
  }
}
