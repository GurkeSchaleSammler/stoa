import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MarkdownContentComponent } from '../../../shared/ui/markdown-content';

@Component({
  selector: 'ui-note-editor',
  imports: [FormsModule, TranslatePipe, MarkdownContentComponent],
  template: `
    <div class="note-editor-tabs">
      <button
        type="button"
        [class.active]="!preview()"
        [attr.aria-pressed]="!preview()"
        (click)="preview.set(false)"
      >
        {{ 'pin.markdownWrite' | translate }}
      </button>
      <button
        type="button"
        [class.active]="preview()"
        [attr.aria-pressed]="preview()"
        (click)="preview.set(true)"
      >
        {{ 'pin.markdownPreview' | translate }}
      </button>
    </div>
    @if (preview()) {
      <div class="note-editor-preview">
        @if (content().trim()) {
          <ui-markdown-content [content]="content()" />
        } @else {
          <p>{{ 'pin.markdownEmpty' | translate }}</p>
        }
      </div>
    } @else {
      <label class="dialog-field">
        <span>{{ 'pin.note' | translate }}</span>
        <textarea
          rows="7"
          [placeholder]="'pin.notePlaceholder' | translate"
          [ngModel]="content()"
          (ngModelChange)="contentChange.emit($event)"
        ></textarea>
      </label>
    }
    <p class="note-editor-hint">{{ 'pin.markdownHint' | translate }}</p>
  `,
  styleUrls: ['./board.scss', './note-editor.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteEditorComponent {
  readonly content = input.required<string>();
  readonly contentChange = output<string>();
  readonly preview = signal(false);
}
