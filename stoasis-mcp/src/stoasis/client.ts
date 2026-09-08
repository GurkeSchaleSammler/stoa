import type { AppConfig } from "../config.js";
import type {
  AuthResponse,
  BoardElements,
  CollectionDetail,
  CollectionSummary,
  Connector,
  FloatingLabel,
  Pin,
  SearchResult,
  StackBlock,
  Sticker,
  User,
  Zone,
} from "./types.js";

export class StoasisApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "StoasisApiError";
  }
}

export type StoasisLogin = {
  sessionCookie: string;
  user: User;
  expiresAt: Date;
};

export class StoasisApiClient {
  constructor(
    private readonly config: Pick<
      AppConfig,
      "stoasisApiBaseUrl" | "stoasisSessionCookie" | "stoasisRequestTimeoutMs"
    >,
    private readonly sessionCookie?: string,
  ) {}

  async login(email: string, password: string): Promise<StoasisLogin> {
    const response = await this.fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const auth = await parseResponse<AuthResponse>(response);
    const sessionCookie = this.extractSessionCookie(response.headers);
    if (!sessionCookie)
      throw new StoasisApiError(502, "Stoasis hat keine Sitzung ausgestellt.");
    return {
      sessionCookie,
      user: auth.user,
      expiresAt: new Date(auth.expiresAt),
    };
  }

  async me(): Promise<User> {
    return this.request<User>("/api/auth/me");
  }

  /** Starts a premium MCP session independently of browser sessions. */
  async connectMcp(): Promise<void> {
    await this.request("/api/profile/mcp/connect", {
      method: "POST",
      body: "{}",
    });
  }

  /** Checks current plan eligibility and account revocation. */
  async authorizeMcp(): Promise<void> {
    await this.request("/api/profile/mcp/authorization");
  }

  async logout(): Promise<void> {
    await this.request("/api/auth/logout", { method: "POST", body: "{}" });
  }

  async listCollections(filter = "all"): Promise<CollectionSummary[]> {
    return this.request<CollectionSummary[]>(
      `/api/collections?filter=${encodeURIComponent(filter)}`,
    );
  }

  async getCollection(collectionId: string): Promise<CollectionDetail> {
    return this.request<CollectionDetail>(
      `/api/collections/${encodeURIComponent(collectionId)}`,
    );
  }

  async createCollection(body: Record<string, unknown>): Promise<unknown> {
    return this.request("/api/collections", {
      method: "POST",
      body: json(body),
    });
  }

  async updateCollection(
    collectionId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request(
      `/api/collections/${encodeURIComponent(collectionId)}`,
      {
        method: "PATCH",
        body: json(body),
      },
    );
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await this.request(`/api/collections/${encodeURIComponent(collectionId)}`, {
      method: "DELETE",
    });
  }

  async listPins(collectionId: string): Promise<Pin[]> {
    return this.request<Pin[]>(
      `/api/collections/${encodeURIComponent(collectionId)}/pins`,
    );
  }

  async createPin(
    collectionId: string,
    body: Record<string, unknown>,
  ): Promise<Pin> {
    return this.request<Pin>(
      `/api/collections/${encodeURIComponent(collectionId)}/pins`,
      {
        method: "POST",
        body: json(body),
      },
    );
  }

  async updatePin(
    collectionId: string,
    pinId: string,
    body: Record<string, unknown>,
  ): Promise<Pin> {
    return this.request<Pin>(
      `/api/collections/${encodeURIComponent(collectionId)}/pins/${encodeURIComponent(pinId)}`,
      { method: "PATCH", body: json(body) },
    );
  }

  async deletePin(collectionId: string, pinId: string): Promise<void> {
    await this.request(
      `/api/collections/${encodeURIComponent(collectionId)}/pins/${encodeURIComponent(pinId)}`,
      { method: "DELETE" },
    );
  }

  async addComment(
    collectionId: string,
    pinId: string,
    body: string,
  ): Promise<unknown> {
    return this.request(
      `/api/collections/${encodeURIComponent(collectionId)}/pins/${encodeURIComponent(pinId)}/comments`,
      { method: "POST", body: json({ body }) },
    );
  }

  async getBoardElements(collectionId: string): Promise<BoardElements> {
    return this.request<BoardElements>(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements`,
    );
  }

  async createStack(
    collectionId: string,
    sourcePinId: string,
    targetPinId: string,
  ): Promise<StackBlock> {
    return this.request<StackBlock>(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/stacks`,
      { method: "POST", body: json({ sourcePinId, targetPinId }) },
    );
  }

  async addPinToStack(
    collectionId: string,
    stackId: string,
    pinId: string,
  ): Promise<StackBlock> {
    return this.request<StackBlock>(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/stacks/${encodeURIComponent(stackId)}/children/${encodeURIComponent(pinId)}`,
      { method: "POST" },
    );
  }

  async updateStack(
    collectionId: string,
    stackId: string,
    body: Record<string, unknown>,
  ): Promise<StackBlock> {
    return this.request<StackBlock>(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/stacks/${encodeURIComponent(stackId)}`,
      { method: "PATCH", body: json(body) },
    );
  }

  async releasePinFromStack(
    collectionId: string,
    stackId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/stacks/${encodeURIComponent(stackId)}/release`,
      { method: "POST", body: json(body) },
    );
  }

  async dissolveStack(
    collectionId: string,
    stackId: string,
  ): Promise<BoardElements> {
    return this.request<BoardElements>(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/stacks/${encodeURIComponent(stackId)}`,
      { method: "DELETE" },
    );
  }

  async createConnector(
    collectionId: string,
    body: Record<string, unknown>,
  ): Promise<Connector> {
    return this.request<Connector>(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/connectors`,
      { method: "POST", body: json(body) },
    );
  }

  async deleteConnector(
    collectionId: string,
    connectorId: string,
  ): Promise<void> {
    await this.request(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/connectors/${encodeURIComponent(connectorId)}`,
      { method: "DELETE" },
    );
  }

  async createDecoration(
    collectionId: string,
    kind: "zones" | "labels" | "stickers",
    body: Record<string, unknown>,
  ): Promise<Zone | FloatingLabel | Sticker> {
    return this.request(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/${kind}`,
      { method: "POST", body: json(body) },
    );
  }

  async updateDecoration(
    collectionId: string,
    kind: "zones" | "labels" | "stickers",
    elementId: string,
    body: Record<string, unknown>,
  ): Promise<Zone | FloatingLabel | Sticker> {
    return this.request(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/${kind}/${encodeURIComponent(elementId)}`,
      { method: "PATCH", body: json(body) },
    );
  }

  async deleteDecoration(
    collectionId: string,
    kind: "zones" | "labels" | "stickers",
    elementId: string,
  ): Promise<void> {
    await this.request(
      `/api/collections/${encodeURIComponent(collectionId)}/board-elements/${kind}/${encodeURIComponent(elementId)}`,
      { method: "DELETE" },
    );
  }

  async search(
    query: string,
    type?: string,
    tag?: string,
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (type) params.set("type", type);
    if (tag) params.set("tag", tag);
    return this.request<SearchResult[]>(`/api/search?${params.toString()}`);
  }

  async previewLink(url: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/api/links/preview?url=${encodeURIComponent(url)}`,
    );
  }

  private async request<T = unknown>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    if (!this.sessionCookie)
      throw new StoasisApiError(401, "Stoasis-Sitzung fehlt.");
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Cookie", this.sessionCookie);
    if (init.body && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    const response = await this.fetch(path, { ...init, headers });
    return parseResponse<T>(response);
  }

  private async fetch(path: string, init: RequestInit): Promise<Response> {
    const base = this.config.stoasisApiBaseUrl.href.endsWith("/")
      ? this.config.stoasisApiBaseUrl
      : new URL(`${this.config.stoasisApiBaseUrl.href}/`);
    const url = new URL(path.replace(/^\//, ""), base);
    try {
      return await fetch(url, {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(this.config.stoasisRequestTimeoutMs),
      });
    } catch (error) {
      if (error instanceof StoasisApiError) throw error;
      throw new StoasisApiError(502, "Stoasis ist momentan nicht erreichbar.");
    }
  }

  private extractSessionCookie(headers: Headers): string | undefined {
    const extended = headers as Headers & { getSetCookie?: () => string[] };
    const values =
      extended.getSetCookie?.() ??
      (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);
    const prefix = `${this.config.stoasisSessionCookie}=`;
    const cookie = values.find((value) => value.trim().startsWith(prefix));
    return cookie?.split(";", 1)[0]?.trim();
  }
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? ((await response.json()) as Record<string, unknown>)
    : { message: await response.text() };
  if (!response.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : `Stoasis API error (${response.status}).`;
    const fieldErrors = isStringRecord(body.fieldErrors)
      ? body.fieldErrors
      : undefined;
    throw new StoasisApiError(response.status, message, fieldErrors);
  }
  return body as T;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}
