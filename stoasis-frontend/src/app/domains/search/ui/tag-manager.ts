import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { Tag } from '../data/models/tag';

@Component({
  selector: 'ui-tag-manager',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `<details class="tag-manager">
    <summary>
      {{ 'search.manageTags' | translate }} <span>{{ tags().length }}</span>
    </summary>
    <div class="tag-create">
      <input
        [placeholder]="'search.newTag' | translate"
        [(ngModel)]="newTagName"
        (keydown.enter)="create()"
      /><button type="button" [disabled]="!canCreate() || !newTagName.trim()" (click)="create()">
        {{ 'common.add' | translate }}
      </button>
    </div>
    <div class="tag-list">
      @for (tag of tags(); track tag.id) {
        <span
          >#{{ tag.name }}
          <button
            type="button"
            [attr.aria-label]="'search.deleteTag' | translate: { tag: tag.name }"
            (click)="onDeleteTag.emit(tag.id)"
          >
            <ui-app-icon name="trash" /></button
        ></span>
      }
    </div>
  </details>`,
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagManagerComponent {
  readonly tags = input.required<Tag[]>();
  readonly canCreate = input(true);
  readonly onCreateTag = output<string>();
  readonly onDeleteTag = output<string>();
  newTagName = '';
  create(): void {
    if (this.newTagName.trim()) {
      this.onCreateTag.emit(this.newTagName.trim());
      this.newTagName = '';
    }
  }
}
