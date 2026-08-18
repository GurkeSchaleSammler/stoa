import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";

export type StoredUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthorizationParameters = {
  state?: string;
  scopes: string[];
  codeChallenge: string;
  redirectUri: string;
  resource?: string;
};

export type PendingAuthorization = {
  id: string;
  csrfHash: string;
  clientId: string;
  clientName: string;
  params: AuthorizationParameters;
  expiresAt: Date;
};

export type AuthorizationCode = {
  codeHash: string;
  clientId: string;
  params: AuthorizationParameters;
  encryptedSession: string;
  user: StoredUser;
  expiresAt: Date;
};

export type StoredToken = {
  tokenHash: string;
  tokenType: "access" | "refresh";
  clientId: string;
  scopes: string[];
  resource?: string;
  encryptedSession: string;
  user: StoredUser;
  expiresAt: Date;
  revokedAt?: Date;
};

export interface OAuthStorage {
  initialize(): Promise<void>;
  close(): Promise<void>;

  getClient(clientId: string): Promise<OAuthClientInformationFull | undefined>;
  saveClient(client: OAuthClientInformationFull): Promise<void>;

  savePendingAuthorization(value: PendingAuthorization): Promise<void>;
  getPendingAuthorization(id: string, csrfHash: string): Promise<PendingAuthorization | undefined>;
  consumePendingAuthorization(id: string, csrfHash: string): Promise<PendingAuthorization | undefined>;

  saveAuthorizationCode(value: AuthorizationCode): Promise<void>;
  getAuthorizationCode(codeHash: string, clientId: string): Promise<AuthorizationCode | undefined>;
  consumeAuthorizationCode(codeHash: string, clientId: string): Promise<AuthorizationCode | undefined>;

  saveToken(value: StoredToken): Promise<void>;
  getAccessToken(tokenHash: string): Promise<StoredToken | undefined>;
  consumeRefreshToken(tokenHash: string, clientId: string): Promise<StoredToken | undefined>;
  revokeToken(tokenHash: string, clientId: string): Promise<void>;
  cleanup(): Promise<void>;
}
