import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TagService } from '../data/application/tag.service';
import { TagManagerComponent } from '../ui/search-components';

@Component({
  selector: 'feature-tag-manager-handler',
  standalone: true,
  imports: [TagManagerComponent],
  template: `<ui-tag-manager
    [tags]="tags.tags()"
    [canCreate]="!tags.isLoading()"
    (onCreateTag)="tags.createTag($event)"
    (onDeleteTag)="tags.deleteTag($event)"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagManagerHandlerComponent {
  protected readonly tags = inject(TagService);
}
