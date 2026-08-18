import { createHash } from "node:crypto";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  STOASIS_API_BASE_URL: z.string().url().default("http://localhost:4000"),
  STOASIS_WEB_BASE_URL: z.string().url().default("http://localhost:8080"),
  STOASIS_SESSION_COOKIE: z.string().min(1).default("stoasis_session"),
  OAUTH_STORAGE: z.enum(["memory", "postgres"]).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_ENCRYPTION_KEY: z.string().min(1).optional(),
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(300).max(86_400).default(3_600),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(3_600).max(7_776_000).default(2_592_000),
  AUTH_CODE_TTL_SECONDS: z.coerce.number().int().min(60).max(600).default(300),
  LOGIN_TRANSACTION_TTL_SECONDS: z.coerce.number().int().min(120).max(1_800).default(600),
  STOASIS_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(12_000),
  MAX_JSON_BODY: z.string().default("1mb"),
});

export type AppConfig = ReturnType<typeof loadConfig>;

function normalizedBaseUrl(raw: string, name: string): URL {
  const url = new URL(raw);
  if (url.search || url.hash) {
    throw new Error(`${name} must not contain a query or fragment.`);
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url;
}

function encryptionKey(raw: string | undefined, production: boolean): Buffer {
  if (!raw) {
    if (production) {
      throw new Error("SESSION_ENCRYPTION_KEY is required in production.");
    }
    return createHash("sha256").update("stoasis-mcp-development-key").digest();
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) {
    throw new Error("SESSION_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return decoded;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.parse(environment);
  const publicBaseUrl = normalizedBaseUrl(parsed.PUBLIC_BASE_URL, "PUBLIC_BASE_URL");
  const stoasisApiBaseUrl = normalizedBaseUrl(parsed.STOASIS_API_BASE_URL, "STOASIS_API_BASE_URL");
  const stoasisWebBaseUrl = normalizedBaseUrl(parsed.STOASIS_WEB_BASE_URL, "STOASIS_WEB_BASE_URL");
  const production = parsed.NODE_ENV === "production";
  const storage = parsed.OAUTH_STORAGE ?? (parsed.DATABASE_URL ? "postgres" : "memory");

  if (production && publicBaseUrl.protocol !== "https:") {
    throw new Error("PUBLIC_BASE_URL must use HTTPS in production.");
  }
  if (production && storage !== "postgres") {
    throw new Error("PostgreSQL OAuth storage is required in production.");
  }
  if (storage === "postgres" && !parsed.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when OAUTH_STORAGE=postgres.");
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    production,
    port: parsed.PORT,
    publicBaseUrl,
    issuerUrl: new URL(publicBaseUrl.href),
    resourceUrl: new URL("mcp", publicBaseUrl.href.endsWith("/") ? publicBaseUrl : `${publicBaseUrl.href}/`),
    stoasisApiBaseUrl,
    stoasisWebBaseUrl,
    stoasisSessionCookie: parsed.STOASIS_SESSION_COOKIE,
    storage,
    databaseUrl: parsed.DATABASE_URL,
    sessionEncryptionKey: encryptionKey(parsed.SESSION_ENCRYPTION_KEY, production),
    trustProxy: parsed.TRUST_PROXY === "true",
    accessTokenTtlSeconds: parsed.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlSeconds: parsed.REFRESH_TOKEN_TTL_SECONDS,
    authCodeTtlSeconds: parsed.AUTH_CODE_TTL_SECONDS,
    loginTransactionTtlSeconds: parsed.LOGIN_TRANSACTION_TTL_SECONDS,
    stoasisRequestTimeoutMs: parsed.STOASIS_REQUEST_TIMEOUT_MS,
    maxJsonBody: parsed.MAX_JSON_BODY,
  } as const;
}
