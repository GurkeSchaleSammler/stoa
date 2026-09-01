import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';

@Component({
  selector: 'ui-stoaql-code-example',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <figure class="code-example">
      <figcaption>
        <span>{{ label() }}</span>
        <button
          type="button"
          (click)="copy()"
          [attr.aria-label]="copied() ? 'Kopiert' : 'Code kopieren'"
        >
          <ui-app-icon [name]="copied() ? 'check' : 'copy'" />
          {{ copied() ? 'Kopiert' : 'Kopieren' }}
        </button>
      </figcaption>
      <pre><code>{{ code() }}</code></pre>
    </figure>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .code-example {
      min-width: 0;
      margin: 0;
      overflow: hidden;
      border: 1px solid #353831;
      border-radius: var(--radius-panel);
      background: #171814;
      box-shadow: inset 0 0 0 1px rgb(255 255 255 / 2%);
    }
    figcaption {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 40px;
      padding: 0 9px 0 14px;
      border-bottom: 1px solid #30322d;
      color: #8f9487;
      font-size: 0.64rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 0 8px;
      border: 0;
      background: transparent;
      color: #b6bbae;
      font: inherit;
      letter-spacing: 0;
      text-transform: none;
      cursor: pointer;
    }
    button:hover {
      color: #f1f2eb;
    }
    button ui-app-icon {
      width: 15px;
      height: 15px;
    }
    pre {
      max-width: 100%;
      overflow: auto;
      margin: 0;
      padding: 17px 18px 19px;
      color: #e4e6dd;
      font:
        0.76rem/1.7 ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
      tab-size: 2;
    }
    code {
      white-space: pre;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoaQlCodeExampleComponent {
  private readonly document = inject(DOCUMENT);
  readonly code = input.required<string>();
  readonly label = input('StoaQL');
  readonly copied = signal(false);

  copy(): void {
    if (this.copyWithSelectionFallback()) {
      this.markCopied();
      return;
    }
    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) return;
    void clipboard
      .writeText(this.code())
      .then(() => this.markCopied())
      .catch(() => undefined);
  }

  private copyWithSelectionFallback(): boolean {
    const copyCommand = this.document.execCommand?.bind(this.document);
    if (!copyCommand) return false;
    const textarea = this.document.createElement('textarea');
    textarea.value = this.code();
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    this.document.body.appendChild(textarea);
    textarea.select();
    const copied = copyCommand('copy');
    textarea.remove();
    return copied;
  }

  private markCopied(): void {
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }
}
