import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { PinService } from '../data/application/pin.service';
import { PinDetailComponent } from '../ui/pin-detail';
import { ConfirmationDialogService } from '../../../shared/application/confirmation-dialog.service';
import { PinEditValue } from '../data/models/pin-edit-value';
import { Pin } from '../../../shared/models/pin';
import { UpdatePinRequest } from '../data/models/update-pin-request';
import { SessionContextStore } from '../../../shared/application/session-context.store';
import { BoardClipboardService } from '../data/application/board-clipboard.service';

@Component({
  selector: 'feature-pin-detail-handler',
  standalone: true,
  imports: [PinDetailComponent],
  template: `
    <ui-pin-detail
      [pin]="pin()"
      [canEdit]="pins.canEdit()"
      [canCopy]="
        !pins.context()?.isSystem && !!pins.context()?.currentUserRole && pin().type !== 'skill'
      "
      [isMutating]="pins.isMutating()"
      [editMode]="editMode()"
      [editValue]="editValue()"
      [allowCustomColors]="allowCustomColors()"
      (onEdit)="editMode.set(true)"
      (onDraftChange)="changeDraft($event)"
      (onSave)="save()"
      (onCancelEdit)="cancelEdit()"
      (onDelete)="deletePin()"
      (onCommentSubmit)="addComment($event)"
      (onClose)="onClose.emit()"
      (copyRequested)="clipboard.copy(pin())"
      (duplicateRequested)="duplicate()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinDetailHandlerComponent {
  protected readonly clipboard = inject(BoardClipboardService);
  protected readonly pins = inject(PinService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly session = inject(SessionContextStore);
  readonly collectionId = input.required<string>();
  readonly pin = input.required<Pin>();
  readonly onClose = output<void>();
  readonly editMode = signal(false);
  readonly allowCustomColors = computed(() => this.session.user()?.plan === 'premium');
  private readonly draft = signal<Partial<PinEditValue>>({});
  readonly editValue = computed<PinEditValue>(() => {
    const pin = this.pin();
    const current = this.draft();
    const hasPinColorDraft = Object.prototype.hasOwnProperty.call(current, 'pinColor');
    return {
      title: current.title ?? (pin.type === 'link' ? pin.data.title : ''),
      description: current.description ?? (pin.type === 'link' ? (pin.data.description ?? '') : ''),
      content: current.content ?? (pin.type === 'note' ? pin.data.content : ''),
      color: current.color ?? (pin.type === 'note' ? pin.data.color : 'white'),
      pinColor: hasPinColorDraft ? (current.pinColor ?? null) : (pin.color ?? null),
      caption: current.caption ?? (pin.type === 'photo' ? (pin.data.caption ?? '') : ''),
      tags: current.tags ?? pin.tags.join(', '),
    };
  });

  changeDraft(changes: Partial<PinEditValue>): void {
    this.draft.update((draft) => ({ ...draft, ...changes }));
  }
  cancelEdit(): void {
    this.draft.set({});
    this.editMode.set(false);
  }
  save(): void {
    const pin = this.pin();
    const values = this.editValue();
    const request: UpdatePinRequest = {
      color: values.pinColor ?? '',
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim().toLocaleLowerCase('de'))
        .filter(Boolean),
      data:
        pin.type === 'link'
          ? { title: values.title.trim(), description: values.description.trim() || null }
          : pin.type === 'note'
            ? { content: values.content.trim(), color: values.color }
            : { caption: values.caption.trim() || null },
    };
    this.pins.updatePin(this.collectionId(), pin.id, request, () => {
      this.cancelEdit();
      this.onClose.emit();
    });
  }
  async deletePin(): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'pin.deleteTitle',
      message: 'pin.confirmDelete',
      confirmLabel: 'common.delete',
      tone: 'danger',
    });
    if (confirmed) {
      this.pins.deletePin(this.collectionId(), this.pin().id, () => this.onClose.emit());
    }
  }
  addComment(body: string): void {
    if (body.trim()) this.pins.addComment(this.collectionId(), this.pin().id, body.trim());
  }
  duplicate(): void {
    this.pins.pastePin(this.collectionId(), this.collectionId(), this.pin().id, () =>
      this.onClose.emit(),
    );
  }
}
