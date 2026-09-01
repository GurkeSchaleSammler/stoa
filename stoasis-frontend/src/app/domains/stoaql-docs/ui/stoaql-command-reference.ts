import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StoaQlCommandDoc } from '../data/stoaql-docs-content';
import { StoaQlCodeExampleComponent } from './stoaql-code-example';

@Component({
  selector: 'ui-stoaql-command-reference',
  standalone: true,
  imports: [StoaQlCodeExampleComponent],
  template: `
    <article class="command" [id]="'command-' + command().name.toLowerCase()">
      <header>
        <div>
          <span class="command-kind">{{ command().kind }}</span>
          <h3>
            <code>{{ command().name }}</code>
          </h3>
        </div>
        <p>{{ command().summary }}</p>
      </header>
      <div class="command-body">
        <section>
          <h4>Syntax</h4>
          <ui-stoaql-code-example [code]="command().syntax" label="Syntax" />
        </section>
        <section>
          <h4>{{ command().examples.length > 1 ? 'Beispiele' : 'Beispiel' }}</h4>
          <ui-stoaql-code-example
            [code]="
              command().examples.join(
                '
'
              )
            "
          />
        </section>
      </div>
      <ul>
        @for (detail of command().details; track detail) {
          <li>{{ detail }}</li>
        }
      </ul>
      @if (command().note; as note) {
        <p class="command-note"><strong>Board-Konsole</strong>{{ note }}</p>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
      scroll-margin-top: 92px;
    }
    .command {
      padding: clamp(22px, 4vw, 32px);
      border: 1px solid var(--border);
      border-radius: var(--radius-panel);
      background: color-mix(in srgb, var(--surface-raised) 96%, var(--accent-soft));
      box-shadow: var(--shadow-sm);
    }
    .command > header {
      display: grid;
      grid-template-columns: minmax(140px, 0.32fr) minmax(0, 1fr);
      align-items: end;
      gap: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .command-kind {
      color: var(--muted);
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h3,
    header p,
    h4 {
      margin: 0;
    }
    h3 {
      margin-top: 5px;
      font-size: 1.42rem;
    }
    h3 code {
      padding: 4px 7px;
      border-radius: 5px;
      background: var(--accent-soft);
      color: var(--accent-strong);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    header p {
      color: var(--muted);
      font-size: 0.85rem;
      line-height: 1.65;
    }
    .command-body {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 22px;
    }
    .command-body section {
      min-width: 0;
    }
    h4 {
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    ul {
      display: grid;
      gap: 7px;
      margin: 18px 0 0;
      padding-left: 20px;
      color: var(--muted);
      font-size: 0.76rem;
      line-height: 1.55;
    }
    li::marker {
      color: var(--accent);
    }
    .command-note {
      display: flex;
      gap: 12px;
      margin: 18px 0 0;
      padding: 12px 14px;
      border-left: 3px solid var(--sage);
      background: var(--sage-soft);
      color: var(--sage);
      font-size: 0.74rem;
      line-height: 1.5;
    }
    @media (max-width: 720px) {
      .command > header,
      .command-body {
        grid-template-columns: 1fr;
      }
      .command > header {
        align-items: start;
        gap: 14px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoaQlCommandReferenceComponent {
  readonly command = input.required<StoaQlCommandDoc>();
}
