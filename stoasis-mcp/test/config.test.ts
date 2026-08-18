import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const key = Buffer.alloc(32, 3).toString("base64");

describe("loadConfig", () => {
  it("allows a local in-memory development setup", () => {
    const config = loadConfig({ NODE_ENV: "test", PUBLIC_BASE_URL: "http://localhost:3000" });
    expect(config.resourceUrl.href).toBe("http://localhost:3000/mcp");
    expect(config.storage).toBe("memory");
  });

  it("requires HTTPS, PostgreSQL and an encryption key in production", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        PUBLIC_BASE_URL: "http://mcp.example.com",
        OAUTH_STORAGE: "postgres",
        DATABASE_URL: "postgres://example",
        SESSION_ENCRYPTION_KEY: key,
      }),
    ).toThrow(/HTTPS/);

    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        PUBLIC_BASE_URL: "https://mcp.example.com",
        OAUTH_STORAGE: "memory",
        SESSION_ENCRYPTION_KEY: key,
      }),
    ).toThrow(/PostgreSQL/);
  });
});
