import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { CollectionService } from '../data/application/collection.service';
import { CollectionCreateDialogComponent } from '../ui/collection-create-dialog';
import { PinType } from '../../../shared/models/pin-type';
import { CreateCollectionRequest } from '../data/models/create-collection-request';
import { BoardTemplateStore } from '../data/application/board-template.store';
import { OnboardingComponent } from '../../../shared/ui/onboarding';
import { Tutorial } from '../../../shared/models/tutorial';

@Component({
  selector: 'feature-collection-create-handler',
  standalone: true,
  imports: [CollectionCreateDialogComponent, OnboardingComponent],
  providers: [BoardTemplateStore],
  template: `
    <ui-collection-create
      [templates]="templates.items()"
      [templatesLoading]="templates.status() === 'loading'"
      [templatesError]="templates.status() === 'error'"
      [availableTypes]="availableTypes"
      [canSubmit]="canSubmit()"
      [isSaving]="collections.isSaving()"
      [error]="collections.error()"
      (onDraftChange)="updateDraft($event)"
      (onSubmit)="submit($event)"
      (onCancel)="cancel()"
    />
    <feature-onboarding [tutorial]="tutorial" [available]="templates.status() === 'ready'" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCreateHandlerComponent {
  protected readonly templates = inject(BoardTemplateStore);
  readonly tutorial: Tutorial = {
    key: 'tutorial.board-templates.v1',
    title: 'templates.tour.title',
    introduction: 'templates.tour.introduction',
    steps: [
      {
        title: 'templates.tour.chooseTitle',
        text: 'templates.tour.chooseText',
        anchor: '[data-tour="templates"]',
      },
      {
        title: 'templates.tour.nameTitle',
        text: 'templates.tour.nameText',
        anchor: '[data-tour="board-name"]',
      },
    ],
  };
  protected readonly collections = inject(CollectionService);
  private readonly router = inject(Router);
  readonly availableTypes: PinType[] = ['link', 'note', 'photo', 'portal'];
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
