import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-stoaql-docs-nav',
  standalone: true,
  template: `
    <nav class="docs-nav" aria-label="Inhalt dieser Dokumentation">
      <p>StoaQL 1.0</p>
      <a href="/stoaql-docs#ueberblick">Überblick</a>
      <a href="/stoaql-docs#schnellstart">Schnellstart</a>
      <a href="/stoaql-docs#grundlagen">Grundlagen</a>
      <a href="/stoaql-docs#syntax">Syntax</a>
      <a href="/stoaql-docs#befehle">Befehlsreferenz</a>
      <div class="command-links">
        @for (command of commands; track command) {
          <a [href]="'/stoaql-docs#command-' + command.toLowerCase()">{{ command }}</a>
        }
      </div>
      <a href="/stoaql-docs#rezepte">Rezepte</a>
      <a href="/stoaql-docs#api">HTTP API</a>
      <a href="/stoaql-docs#fehler">Fehler &amp; Limits</a>
      <a href="/stoaql-docs#sicherheit">Sicherheit</a>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .docs-nav {
      position: sticky;
      top: 94px;
      display: grid;
      max-height: calc(100dvh - 116px);
      overflow: auto;
      padding-right: 18px;
      scrollbar-width: thin;
    }
    p {
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    a {
      padding: 6px 10px;
      border-left: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.74rem;
      line-height: 1.35;
      text-decoration: none;
    }
    a:hover,
    a:focus-visible {
      border-left-color: var(--accent);
      color: var(--text);
    }
    .command-links {
      display: grid;
      margin: 2px 0 6px;
    }
    .command-links a {
      padding-block: 3px;
      padding-left: 22px;
      font:
        650 0.66rem/1.35 ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;
    }
    @media (max-width: 920px) {
      :host {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoaQlDocsNavComponent {
  readonly commands = [
    'USE',
    'ADD',
    'LINK',
    'CONNECT',
    'DISCONNECT',
    'FIND',
    'GET',
    'UPDATE',
    'DELETE',
    'MOVE',
    'LAYOUT',
  ];
}
