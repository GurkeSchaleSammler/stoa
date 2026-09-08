import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../../../shared/api/api-url';

/** Describes account eligibility and the most recent MCP connection. */
export interface McpConnection {
  eligible: boolean;
  connectedAt: string | null;
  endpoint: string | null;
}

/** Loads connection status and revokes all account grants. */
@Injectable()
export class McpConnectionService {
  private readonly http = inject(HttpClient);
  readonly connection = signal<McpConnection | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async load(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      this.connection.set(
        await firstValueFrom(this.http.get<McpConnection>(`${API_URL}/profile/mcp`)),
      );
    } catch {
      this.error.set('mcp.unavailable');
    } finally {
      this.busy.set(false);
    }
  }

  async revoke(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete<void>(`${API_URL}/profile/mcp`));
      this.connection.update((value) => (value ? { ...value, connectedAt: null } : null));
    } catch {
      this.error.set('mcp.revokeError');
    } finally {
      this.busy.set(false);
    }
  }
}
