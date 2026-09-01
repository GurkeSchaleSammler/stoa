import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../../shared/ui/app-icon';

@Component({
  selector: 'ui-stoaql-docs-header',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  template: `
    <header class="docs-header">
      <a class="docs-brand" routerLink="/" aria-label="Stoasis Startseite">
        <span class="brand-mark"><img src="/android-chrome-192x192.png" alt="" /></span>
        <span class="brand-copy"><strong>stoasis</strong><small>StoaQL Docs</small></span>
      </a>
      <nav aria-label="Dokumentationsnavigation">
        <a href="/stoaql-docs#grundlagen">Grundlagen</a>
        <a href="/stoaql-docs#befehle">Befehle</a>
        <a href="/stoaql-docs#api">API</a>
      </nav>
      <a class="app-link" routerLink="/"> Stoasis öffnen <ui-app-icon name="chevron-right" /> </a>
    </header>
  `,
  styles: `
    :host {
      position: sticky;
      z-index: 30;
      top: 0;
      display: block;
    }
    .docs-header {
      display: grid;
      grid-template-columns: minmax(210px, 1fr) auto minmax(210px, 1fr);
      align-items: center;
      gap: 24px;
      min-height: 68px;
      padding: 9px clamp(18px, 4vw, 54px);
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-sunken) 88%, transparent);
      backdrop-filter: blur(18px);
    }
    .docs-brand,
    .app-link,
    nav {
      display: flex;
      align-items: center;
    }
    .docs-brand {
      justify-self: start;
      gap: 10px;
      color: var(--text);
      text-decoration: none;
    }
    .brand-mark {
      display: grid;
      width: 38px;
      height: 38px;
      place-items: center;
      border: 1px solid color-mix(in srgb, var(--border-strong) 65%, transparent);
      border-radius: var(--radius-control);
      background: #16120d;
      overflow: hidden;
    }
    .brand-mark img {
      width: 74%;
      height: 74%;
      object-fit: contain;
    }
    .brand-copy {
      display: grid;
      gap: 1px;
    }
    .brand-copy strong {
      font-family: var(--font-display);
      font-size: 1.05rem;
    }
    .brand-copy small {
      color: var(--muted);
      font-size: 0.62rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    nav {
      justify-content: center;
      gap: 5px;
    }
    nav a,
    .app-link {
      min-height: 36px;
      padding: 0 11px;
      border-radius: var(--radius-control);
      color: var(--muted);
      font-size: 0.73rem;
      font-weight: 700;
      text-decoration: none;
    }
    nav a:hover {
      background: var(--surface-raised);
      color: var(--text);
    }
    .app-link {
      justify-self: end;
      gap: 5px;
      border: 1px solid var(--border);
      background: var(--surface-raised);
      color: var(--text);
    }
    .app-link ui-app-icon {
      width: 16px;
      height: 16px;
    }
    @media (max-width: 760px) {
      .docs-header {
        grid-template-columns: 1fr auto;
        gap: 12px;
      }
      nav {
        display: none;
      }
      .app-link {
        padding-inline: 9px;
      }
    }
    @media (max-width: 430px) {
      .brand-copy small,
      .app-link ui-app-icon {
        display: none;
      }
      .app-link {
        font-size: 0.68rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoaQlDocsHeaderComponent {}
