import express, { type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { z } from "zod";
import { StoasisOAuthProvider, SUPPORTED_SCOPES } from "./auth/provider.js";
import { loadConfig } from "./config.js";
import { SecretBox } from "./crypto.js";
import { createStoasisMcpServer } from "./mcp/server.js";
import { MemoryOAuthStorage } from "./storage/memory.js";
import { PostgresOAuthStorage } from "./storage/postgres.js";
import type { OAuthStorage } from "./storage/types.js";

const loginSchema = z.object({
  transaction_id: z.string().min(20).max(200),
  csrf_token: z.string().min(20).max(200),
  email: z.string().email().max(320),
  password: z.string().min(1).max(1_024),
});

async function main(): Promise<void> {
  const config = loadConfig();
  const storage: OAuthStorage =
    config.storage === "postgres"
      ? new PostgresOAuthStorage(config.databaseUrl as string)
      : new MemoryOAuthStorage();
  await storage.initialize();

  if (config.storage === "memory") {
    console.warn(
      "Stoasis MCP uses in-memory OAuth storage. This is suitable only for local development.",
    );
  }

  const provider = new StoasisOAuthProvider(
    config,
    storage,
    new SecretBox(config.sessionEncryptionKey),
  );
  const app = express();
  if (config.trustProxy) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(express.json({ limit: config.maxJsonBody }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (config.production)
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    next();
  });

  app.get("/healthz", (_req, res) => {
    res
      .status(200)
      .json({ status: "ok", service: "stoasis-mcp", version: "1.0.0" });
  });

  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("text/plain")
      .send(
        `Stoasis MCP\n\nMCP endpoint: ${config.resourceUrl.href}\nOAuth discovery: ${new URL(".well-known/oauth-authorization-server", config.publicBaseUrl).href}\n`,
      );
  });

  app.get("/docs", (_req, res) => {
    res.status(200).json({
      name: "Stoasis MCP",
      endpoint: config.resourceUrl.href,
      transport: "streamable-http",
      authentication: "OAuth 2.1 authorization code with PKCE",
      scopes: SUPPORTED_SCOPES,
      boardModel: [
        "pins",
        "stacks",
        "connectors",
        "zones",
        "labels",
        "stickers",
      ],
    });
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Zu viele Anmeldeversuche. Bitte warte kurz.",
  });
  app.post(
    "/oauth/login",
    loginLimiter,
    express.urlencoded({ extended: false, limit: "16kb" }),
    async (req: Request, res: Response) => {
      const input = loginSchema.safeParse(req.body);
      if (!input.success) {
        res
          .status(400)
          .type("text/plain")
          .send("Ungültige Anmeldung. Bitte starte die Verbindung erneut.");
        return;
      }
      await provider.completeAuthorization(
        {
          transactionId: input.data.transaction_id,
          csrfToken: input.data.csrf_token,
          email: input.data.email,
          password: input.data.password,
        },
        res,
      );
    },
  );

  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl: config.issuerUrl,
      resourceServerUrl: config.resourceUrl,
      serviceDocumentationUrl: new URL("docs", config.publicBaseUrl),
      scopesSupported: [...SUPPORTED_SCOPES],
      resourceName: "Stoasis boards",
      clientRegistrationOptions: { clientSecretExpirySeconds: 0 },
    }),
  );

  const bearerAuth = requireBearerAuth({
    verifier: provider,
    requiredScopes: [],
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(
      config.resourceUrl,
    ),
  });

  const mcpLimiter = rateLimit({
    windowMs: 60 * 1_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      jsonrpc: "2.0",
      error: { code: -32000, message: "MCP rate limit exceeded" },
      id: null,
    },
  });

  app.post("/mcp", bearerAuth, mcpLimiter, async (req, res) => {
    const startedAt = Date.now();
    const requestBody = req.body as
      { method?: string; params?: { name?: string } } | undefined;
    const operation =
      requestBody?.method === "tools/call"
        ? `tools/call:${requestBody.params?.name ?? "unknown"}`
        : (requestBody?.method ?? "unknown");
    const server = createStoasisMcpServer(config);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      console.info(
        JSON.stringify({
          event: "mcp_request",
          operation,
          status: res.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "mcp_error",
          operation,
          durationMs: Date.now() - startedAt,
        }),
      );
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    } finally {
      await transport.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    }
  });

  const methodNotAllowed = (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed for stateless Streamable HTTP.",
      },
      id: null,
    });
  };
  app.get("/mcp", bearerAuth, methodNotAllowed);
  app.delete("/mcp", bearerAuth, methodNotAllowed);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: express.NextFunction,
    ) => {
      console.error(
        JSON.stringify({
          event: "http_error",
          message: error instanceof Error ? error.message : "unknown",
        }),
      );
      if (!res.headersSent)
        res.status(500).json({ error: "Internal server error" });
    },
  );

  const httpServer = app.listen(config.port, "0.0.0.0", () => {
    console.info(
      `Stoasis MCP listening on ${config.publicBaseUrl.href} (port ${config.port})`,
    );
  });

  const cleanupTimer = setInterval(
    () => {
      storage
        .cleanup()
        .catch(() =>
          console.error(JSON.stringify({ event: "oauth_cleanup_error" })),
        );
    },
    15 * 60 * 1_000,
  );
  cleanupTimer.unref();

  const shutdown = async (signal: string) => {
    console.info(`Stoasis MCP received ${signal}; shutting down.`);
    clearInterval(cleanupTimer);
    httpServer.close();
    await storage.close();
    process.exit(0);
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Stoasis MCP failed to start.",
  );
  process.exit(1);
});
