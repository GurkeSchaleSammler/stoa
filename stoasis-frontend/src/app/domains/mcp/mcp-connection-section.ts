import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { McpConnectionService } from './data/mcp-connection.service';

/** Presents MCP eligibility, setup and account-wide disconnection. */
@Component({
  selector: 'feature-mcp-connection',
  imports: [TranslatePipe, DatePipe],
  providers: [McpConnectionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../profile/ui/profile.scss',
  template: `
    <section class="settings-section stack" aria-labelledby="mcp-title">
      <div>
        <p class="eyebrow">ChatGPT</p>
        <h2 id="mcp-title">{{ 'mcp.title' | translate }}</h2>
      </div>
      @if (mcp.error(); as error) {
        <p role="alert">{{ error | translate }}</p>
        <button class="button secondary" [disabled]="mcp.busy()" (click)="mcp.load()">
          {{ 'common.tryAgain' | translate }}
        </button>
      }
      @if (mcp.connection(); as connection) {
        @if (!connection.eligible) {
          <p>{{ 'mcp.premiumRequired' | translate }}</p>
        } @else {
          <p role="status">
            {{ (connection.connectedAt ? 'mcp.connected' : 'mcp.disconnected') | translate }}
          </p>
          @if (connection.connectedAt) {
            <small>{{ connection.connectedAt | date: 'medium' }}</small>
          }
          @if (connection.endpoint) {
            <p>{{ 'mcp.setup' | translate }}</p>
            <code>{{ connection.endpoint }}</code>
            <p>{{ 'mcp.scopes' | translate }}</p>
          } @else {
            <p>{{ 'mcp.notConfigured' | translate }}</p>
          }
        }
        @if (connection.connectedAt) {
          <button class="button danger-ghost" [disabled]="mcp.busy()" (click)="mcp.revoke()">
            {{ 'mcp.revoke' | translate }}
          </button>
        }
      } @else if (mcp.busy()) {
        <p role="status">{{ 'common.loading' | translate }}</p>
      }
    </section>
  `,
})
export class McpConnectionSectionComponent {
  protected readonly mcp = inject(McpConnectionService);
  constructor() {
    void this.mcp.load();
  }
}
