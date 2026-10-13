import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ViewportService } from '../../../shared/application/viewport.service';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { PinType } from '../../../shared/models/pin-type';
import { CreateCollectionRequest } from '../data/models/create-collection-request';
import { BoardTemplatePickerComponent } from './board-template-picker';
import { BoardTemplate } from '../data/models/board-template';
import { signal } from '@angular/core';

@Component({
  selector: 'ui-collection-create',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent, BoardTemplatePickerComponent],
  template: `
    <section class="panel-card create-card" aria-labelledby="create-title">
      <div class="eyebrow">{{ 'collection.newBoard' | translate }}</div>
      <h1 id="create-title">{{ 'collection.createTitle' | translate }}</h1>
      <p class="lead">{{ 'collection.createLead' | translate }}</p>
      @if (error()) {
        <p class="error-banner" role="alert">{{ error() | translate }}</p>
      }
      @if (templatesLoading()) {
        <p role="status">{{ 'templates.loading' | translate }}</p>
      }
      @if (templatesError()) {
        <p role="alert">{{ 'templates.loadError' | translate }}</p>
      }
      <ui-board-template-picker
        [templates]="templates()"
        [selected]="templateId()"
        (selectedChanged)="selectTemplate($event)"
      />
      <div class="form-grid" data-tour="board-name">
        <label class="emoji-field">
          <span>{{ 'common.emoji' | translate }}</span>
          <input type="text" maxlength="4" [(ngModel)]="emoji" (ngModelChange)="emitDraft()" />
        </label>
        <label>
          <span>{{ 'common.name' | translate }}</span>
          <input
            type="text"
            [attr.autofocus]="viewport.compact() ? null : ''"
            [placeholder]="'collection.namePlaceholder' | translate"
            [(ngModel)]="name"
            (ngModelChange)="emitDraft()"
          />
        </label>
      </div>
      @if (!templateId()) {
        <fieldset>
          <legend>{{ 'collection.allowedPinTypes' | translate }}</legend>
          <div class="type-picker">
            <label
              ><input type="checkbox" [(ngModel)]="link" (ngModelChange)="emitDraft()" />
              <span><ui-app-icon name="link" /></span
              ><strong>{{ 'pin.types.links' | translate }}</strong></label
            >
            <label
              ><input type="checkbox" [(ngModel)]="note" (ngModelChange)="emitDraft()" />
              <span><ui-app-icon name="note" /></span
              ><strong>{{ 'pin.types.notes' | translate }}</strong></label
            >
            <label
              ><input type="checkbox" [(ngModel)]="photo" (ngModelChange)="emitDraft()" />
              <span><ui-app-icon name="image" /></span
              ><strong>{{ 'pin.types.photos' | translate }}</strong></label
            >
            <label
              ><input type="checkbox" [(ngModel)]="portal" (ngModelChange)="emitDraft()" />
              <span><ui-app-icon name="door" /></span
              ><strong>{{ 'pin.types.portals' | translate }}</strong></label
            >
          </div>
        </fieldset>
      } @else {
        <p class="lead">{{ 'templates.editableHint' | translate }}</p>
      }
      <div class="panel-actions">
        <button type="button" class="button secondary" (click)="onCancel.emit()">
          {{ 'common.cancel' | translate }}
        </button>
        <button
          type="button"
          class="button primary"
          [disabled]="!canSubmit() || isSaving()"
          (click)="submit()"
        >
          {{ (isSaving() ? 'collection.creating' : 'collection.create') | translate }}
        </button>
      </div>
    </section>
  `,
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionCreateDialogComponent {
  protected readonly viewport = inject(ViewportService);
  readonly templates = input<BoardTemplate[]>([]);
  readonly templatesLoading = input(false);
  readonly templatesError = input(false);
  readonly templateId = signal('');
  selectTemplate(id: string): void {
    this.templateId.set(id);
    this.emitDraft();
  }
  readonly isOpen = input(true);
  readonly canSubmit = input(false);
  readonly isSaving = input(false);
  readonly error = input<string | null>(null);
  readonly availableTypes = input.required<PinType[]>();
  readonly onSubmit = output<CreateCollectionRequest>();
  readonly onCancel = output<void>();
  readonly onDraftChange = output<CreateCollectionRequest>();
  name = '';
  emoji = '📌';
  link = true;
  note = true;
  photo = true;
  portal = true;

  emitDraft(): void {
    this.onDraftChange.emit(this.draft());
  }
  submit(): void {
    this.onSubmit.emit(this.draft());
  }

  private draft(): CreateCollectionRequest {
    const allowedTypes: PinType[] = [];
    if (this.link) allowedTypes.push('link');
    if (this.note) allowedTypes.push('note');
    if (this.photo) allowedTypes.push('photo');
    if (this.portal) allowedTypes.push('portal');
    return {
      name: this.name,
      emoji: this.emoji || '📌',
      allowedTypes: this.templateId() ? ['link', 'note', 'photo', 'portal'] : allowedTypes,
      templateId: this.templateId() || undefined,
    };
  }
}
