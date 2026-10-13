import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { Marked } from 'marked';

const markdown = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    // Treat embedded HTML as text. Angular also sanitizes the generated HTML binding.
    html: ({ text }) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    checkbox: ({ checked }) => `<span class="markdown-checkbox">${checked ? '☑' : '☐'}</span> `,
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      const tooltip = title ? ` title="${escapeAttribute(title)}"` : '';
      return `<a href="${escapeAttribute(href)}"${tooltip} target="_blank" rel="noopener noreferrer">${label}</a>`;
    },
  },
});

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

@Component({
  selector: 'ui-markdown-content',
  host: { '(pointerdown)': 'handleLinkEvent($event)', '(click)': 'handleLinkEvent($event)' },
  template: '<div class="markdown-content" [innerHTML]="html()"></div>',
  styleUrl: './markdown-content.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownContentComponent {
  readonly content = input.required<string>();
  readonly html = computed(() => markdown.parse(this.content(), { async: false }));

  handleLinkEvent(event: Event): void {
    if ((event.target as Element).closest('a')) event.stopPropagation();
  }
}
