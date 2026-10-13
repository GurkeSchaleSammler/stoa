import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { BoardTemplate } from '../data/models/board-template';

@Component({
  selector: 'ui-board-template-picker',
  standalone: true,
  imports: [TranslatePipe, AppIconComponent],
  template: `
    <fieldset data-tour="templates">
      <legend>{{ 'templates.choose' | translate }}</legend>
      <p class="hint">{{ 'templates.lead' | translate }}</p>
      <div class="template-grid">
        <button
          type="button"
          class="template-card blank"
          [class.selected]="!selected()"
          [attr.aria-pressed]="!selected()"
          (click)="selectedChanged.emit('')"
        >
          <div class="preview blank-preview" aria-hidden="true"><ui-app-icon name="plus" /></div>
          <strong>{{ 'templates.blank' | translate }}</strong
          ><span>{{ 'templates.blankHint' | translate }}</span>
          @if (!selected()) {
            <ui-app-icon name="check" />
          }
        </button>
        @for (template of templates(); track template.id) {
          <button
            type="button"
            class="template-card"
            [class.selected]="selected() === template.id"
            [attr.aria-pressed]="selected() === template.id"
            (click)="selectedChanged.emit(template.id)"
          >
            <div class="preview" aria-hidden="true">
              @for (section of template.sections; track $index) {
                <div
                  class="preview-zone"
                  [style.background]="'var(--' + section.color + '-soft, var(--accent-soft))'"
                >
                  <span class="preview-label">{{ section.title }}</span>
                  <i class="preview-note"><span></span><span></span><span></span></i>
                </div>
              }
              <ui-app-icon
                class="preview-sticker"
                [name]="template.id === 'research' ? 'search' : 'sparkles'"
              />
            </div>
            <strong>{{ 'templates.' + template.id + '.title' | translate }}</strong>
            <span>{{ 'templates.' + template.id + '.hint' | translate }}</span>
            @if (selected() === template.id) {
              <ui-app-icon name="check" />
            }
          </button>
        }
      </div>
    </fieldset>
  `,
  styleUrl: './board-template-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardTemplatePickerComponent {
  readonly templates = input.required<BoardTemplate[]>();
  readonly selected = input('');
  readonly selectedChanged = output<string>();
}
