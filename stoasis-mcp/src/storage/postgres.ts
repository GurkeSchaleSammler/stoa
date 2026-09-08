import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type {
  AuthorizationCode,
  AuthorizationParameters,
  OAuthStorage,
  PendingAuthorization,
  StoredToken,
  StoredUser,
} from "./types.js";

type PendingRow = QueryResultRow & {
  id: string;
  csrf_hash: string;
  client_id: string;
  client_name: string;
  params: AuthorizationParameters;
  expires_at: Date;
};

type CodeRow = QueryResultRow & {
  code_hash: string;
  client_id: string;
  params: AuthorizationParameters;
  encrypted_session: string;
  user_data: StoredUser;
  expires_at: Date;
};

type TokenRow = QueryResultRow & {
  token_hash: string;
  token_type: "access" | "refresh";
  client_id: string;
  scopes: string[];
  resource: string | null;
  encrypted_session: string;
  user_data: StoredUser;
  expires_at: Date;
  revoked_at: Date | null;
};

export class PostgresOAuthStorage implements OAuthStorage {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS stoasis_mcp_oauth_clients (
        client_id TEXT PRIMARY KEY,
        client_data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stoasis_mcp_login_transactions (
        id TEXT PRIMARY KEY,
        csrf_hash TEXT NOT NULL,
        client_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        params JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS stoasis_mcp_login_transactions_expiry_idx
        ON stoasis_mcp_login_transactions (expires_at);

      CREATE TABLE IF NOT EXISTS stoasis_mcp_authorization_codes (
        code_hash TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        params JSONB NOT NULL,
        encrypted_session TEXT NOT NULL,
        user_data JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS stoasis_mcp_authorization_codes_expiry_idx
        ON stoasis_mcp_authorization_codes (expires_at);

      CREATE TABLE IF NOT EXISTS stoasis_mcp_tokens (
        token_hash TEXT PRIMARY KEY,
        token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh')),
        client_id TEXT NOT NULL,
        scopes TEXT[] NOT NULL,
        resource TEXT,
        encrypted_session TEXT NOT NULL,
        user_data JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS stoasis_mcp_tokens_expiry_idx
        ON stoasis_mcp_tokens (expires_at);
      CREATE INDEX IF NOT EXISTS stoasis_mcp_tokens_client_idx
        ON stoasis_mcp_tokens (client_id);
    `);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getClient(
    clientId: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    const result = await this.pool.query<{
      client_data: OAuthClientInformationFull;
    }>(
      "SELECT client_data FROM stoasis_mcp_oauth_clients WHERE client_id = $1",
      [clientId],
    );
    return result.rows[0]?.client_data;
  }

  async saveClient(client: OAuthClientInformationFull): Promise<void> {
    await this.pool.query(
      `INSERT INTO stoasis_mcp_oauth_clients (client_id, client_data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (client_id) DO UPDATE
       SET client_data = EXCLUDED.client_data, updated_at = NOW()`,
      [client.client_id, JSON.stringify(client)],
    );
  }

  async savePendingAuthorization(value: PendingAuthorization): Promise<void> {
    await this.pool.query(
      `INSERT INTO stoasis_mcp_login_transactions
         (id, csrf_hash, client_id, client_name, params, expires_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        value.id,
        value.csrfHash,
        value.clientId,
        value.clientName,
        JSON.stringify(value.params),
        value.expiresAt,
      ],
    );
  }

  async getPendingAuthorization(
    id: string,
    csrfHash: string,
  ): Promise<PendingAuthorization | undefined> {
    const result = await this.pool.query<PendingRow>(
      `SELECT * FROM stoasis_mcp_login_transactions
       WHERE id = $1 AND csrf_hash = $2 AND expires_at > NOW()`,
      [id, csrfHash],
    );
    return result.rows[0] ? pendingFromRow(result.rows[0]) : undefined;
  }

  async consumePendingAuthorization(
    id: string,
    csrfHash: string,
  ): Promise<PendingAuthorization | undefined> {
    const result = await this.pool.query<PendingRow>(
      `DELETE FROM stoasis_mcp_login_transactions
       WHERE id = $1 AND csrf_hash = $2 AND expires_at > NOW()
       RETURNING *`,
      [id, csrfHash],
    );
    return result.rows[0] ? pendingFromRow(result.rows[0]) : undefined;
  }

  async saveAuthorizationCode(value: AuthorizationCode): Promise<void> {
    await this.pool.query(
      `INSERT INTO stoasis_mcp_authorization_codes
         (code_hash, client_id, params, encrypted_session, user_data, expires_at)
       VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6)`,
      [
        value.codeHash,
        value.clientId,
        JSON.stringify(value.params),
        value.encryptedSession,
        JSON.stringify(value.user),
        value.expiresAt,
      ],
    );
  }

  async getAuthorizationCode(
    codeHash: string,
    clientId: string,
  ): Promise<AuthorizationCode | undefined> {
    const result = await this.pool.query<CodeRow>(
      `SELECT * FROM stoasis_mcp_authorization_codes
       WHERE code_hash = $1 AND client_id = $2 AND expires_at > NOW()`,
      [codeHash, clientId],
    );
    return result.rows[0] ? codeFromRow(result.rows[0]) : undefined;
  }

  async consumeAuthorizationCode(
    codeHash: string,
    clientId: string,
  ): Promise<AuthorizationCode | undefined> {
    const result = await this.pool.query<CodeRow>(
      `DELETE FROM stoasis_mcp_authorization_codes
       WHERE code_hash = $1 AND client_id = $2 AND expires_at > NOW()
       RETURNING *`,
      [codeHash, clientId],
    );
    return result.rows[0] ? codeFromRow(result.rows[0]) : undefined;
  }

  async saveToken(value: StoredToken): Promise<void> {
    await this.pool.query(
      `INSERT INTO stoasis_mcp_tokens
         (token_hash, token_type, client_id, scopes, resource, encrypted_session, user_data, expires_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [
        value.tokenHash,
        value.tokenType,
        value.clientId,
        value.scopes,
        value.resource ?? null,
        value.encryptedSession,
        JSON.stringify(value.user),
        value.expiresAt,
        value.revokedAt ?? null,
      ],
    );
  }

  async getAccessToken(tokenHash: string): Promise<StoredToken | undefined> {
    const result = await this.pool.query<TokenRow>(
      `SELECT * FROM stoasis_mcp_tokens
       WHERE token_hash = $1 AND token_type = 'access'
         AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash],
    );
    return result.rows[0] ? tokenFromRow(result.rows[0]) : undefined;
  }

  async consumeRefreshToken(
    tokenHash: string,
    clientId: string,
  ): Promise<StoredToken | undefined> {
    return this.withTransaction(async (client) => {
      const result = await client.query<TokenRow>(
        `UPDATE stoasis_mcp_tokens SET revoked_at = NOW()
         WHERE token_hash = $1 AND token_type = 'refresh' AND client_id = $2
           AND revoked_at IS NULL AND expires_at > NOW()
         RETURNING *`,
        [tokenHash, clientId],
      );
      return result.rows[0] ? tokenFromRow(result.rows[0]) : undefined;
    });
  }

  async revokeToken(tokenHash: string, clientId: string): Promise<void> {
    await this.pool.query(
      `UPDATE stoasis_mcp_tokens SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE client_id = $2 AND encrypted_session IN (
         SELECT encrypted_session FROM stoasis_mcp_tokens WHERE token_hash = $1 AND client_id = $2
       )`,
      [tokenHash, clientId],
    );
  }

  async cleanup(): Promise<void> {
    await this.pool.query(`
      DELETE FROM stoasis_mcp_login_transactions WHERE expires_at <= NOW();
      DELETE FROM stoasis_mcp_authorization_codes WHERE expires_at <= NOW();
      DELETE FROM stoasis_mcp_tokens
        WHERE expires_at <= NOW() OR revoked_at < NOW() - INTERVAL '1 day';
    `);
  }

  private async withTransaction<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function pendingFromRow(row: PendingRow): PendingAuthorization {
  return {
    id: row.id,
    csrfHash: row.csrf_hash,
    clientId: row.client_id,
    clientName: row.client_name,
    params: row.params,
    expiresAt: row.expires_at,
  };
}

function codeFromRow(row: CodeRow): AuthorizationCode {
  return {
    codeHash: row.code_hash,
    clientId: row.client_id,
    params: row.params,
    encryptedSession: row.encrypted_session,
    user: row.user_data,
    expiresAt: row.expires_at,
  };
}

function tokenFromRow(row: TokenRow): StoredToken {
  const base = {
    tokenHash: row.token_hash,
    tokenType: row.token_type,
    clientId: row.client_id,
    scopes: row.scopes,
    encryptedSession: row.encrypted_session,
    user: row.user_data,
    expiresAt: row.expires_at,
  } satisfies Omit<StoredToken, "resource" | "revokedAt">;
  return {
    ...base,
    ...(row.resource ? { resource: row.resource } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
  };
}
