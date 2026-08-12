import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { PinType } from '../../../shared/models/core.models';
import { CollectionService } from '../data/application/collection.service';
import { CreateCollectionRequest } from '../data/models/collection.models';
import { CollectionCreateDialogComponent } from '../ui/collection-components';

@Component({
  selector: 'feature-collection-create-handler',
  standalone: true,
  imports: [CollectionCreateDialogComponent],
  template: `
    <ui-collection-create
      [availableTypes]="availableTypes"
      [canSubmit]="canSubmit()"
      [isSaving]="collections.isSaving()"
      [error]="collections.error()"
      (onDraftChange)="updateDraft($event)"
      (onSubmit)="submit($event)"
      (onCancel)="cancel()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCreateHandlerComponent {
  protected readonly collections = inject(CollectionService);
  private readonly router = inject(Router);
  readonly availableTypes: PinType[] = ['link', 'note', 'photo'];
  private readonly model = signal<CreateCollectionRequest>({
    name: '',
    emoji: '📌',
    allowedTypes: this.availableTypes,
  });
  readonly createForm = form(this.model, (path) => required(path.name));
  readonly canSubmit = computed(
    () => this.createForm().valid() && this.model().allowedTypes.length > 0,
  );

  updateDraft(draft: CreateCollectionRequest): void {
    this.model.set(draft);
  }
  submit(draft: CreateCollectionRequest): void {
    this.model.set(draft);
    if (this.canSubmit()) this.collections.create({ ...draft, name: draft.name.trim() });
  }
  cancel(): void {
    void this.router.navigateByUrl('/');
  }
}
