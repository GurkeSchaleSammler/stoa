import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import { LinkParserService } from '../data/application/link-parser.service';
import { PhotoUploadService } from '../data/application/photo-upload.service';
import { PinService } from '../data/application/pin.service';
import { AddPinDialogComponent } from '../ui/add-pin-dialog';
import { AddPinDraft } from '../data/models/add-pin-draft';
import { PinType } from '../../../shared/models/pin-type';
import { CreatePinRequest } from '../data/models/create-pin-request';
import { LinkPinData } from '../../../shared/models/link-pin-data';
import { NotePinData } from '../../../shared/models/note-pin-data';
import { PhotoPinData } from '../../../shared/models/photo-pin-data';
import { SessionContextStore } from '../../../shared/application/session-context.store';

const emptyDraft: AddPinDraft = {
  type: null,
  url: '',
  content: '',
  color: 'white',
  pinColor: null,
  caption: '',
  tags: '',
};

@Component({
  selector: 'feature-add-pin-dialog-handler',
  standalone: true,
  imports: [AddPinDialogComponent],
  template: `
    <ui-add-pin-dialog
      [isOpen]="isOpen()"
      [allowedTypes]="allowedTypes()"
      [selectedType]="draft().type"
      [draft]="draft()"
      [preview]="parser.preview()"
      [canSubmit]="canSubmit()"
      [isUploading]="upload.isUploading()"
      [isParsing]="parser.isLoading()"
      [uploadProgress]="upload.progress()"
      [uploadedFileName]="upload.photo()?.originalName || null"
      [uploadedPhoto]="upload.photo()"
      [error]="parser.error() || upload.error() || pins.error()"
      [allowCustomColors]="allowCustomColors()"
      (onTypeSelect)="selectType($event)"
      (onUrlChange)="parser.parseMetadata($event)"
      (onFileSelect)="upload.upload($event)"
      (onDraftChange)="changeDraft($event)"
      (onSubmit)="submit()"
      (onCancel)="cancel()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPinDialogHandlerComponent {
  protected readonly pins = inject(PinService);
  protected readonly parser = inject(LinkParserService);
  protected readonly upload = inject(PhotoUploadService);
  private readonly session = inject(SessionContextStore);
  readonly collectionId = input.required<string>();
  readonly allowedTypes = input.required<PinType[]>();
  readonly isOpen = input(false);
  readonly onClose = output<void>();
  private readonly draftModel = signal<AddPinDraft>(emptyDraft);
  readonly pinForm = form(this.draftModel);
  readonly draft = computed(() => this.draftModel());
  readonly allowCustomColors = computed(() => this.session.user()?.plan === 'premium');
  readonly canSubmit = computed(() => {
    const draft = this.draftModel();
    if (!draft.type || !this.allowedTypes().includes(draft.type)) return false;
    if (draft.type === 'link') return /^https?:\/\//i.test(draft.url.trim());
    if (draft.type === 'note') return draft.content.trim().length > 0;
    return this.upload.photo() !== null && !this.upload.isUploading();
  });

  selectType(type: PinType): void {
    this.draftModel.update((draft) => ({ ...draft, type }));
  }

  changeDraft(changes: Partial<AddPinDraft>): void {
    this.draftModel.update((draft) => ({ ...draft, ...changes }));
    if (changes.url !== undefined) this.parser.parseMetadata(changes.url);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const draft = this.draftModel();
    const request = this.createRequest(draft);
    if (!request) return;
    this.pins.createPin(this.collectionId(), request, () => {
      this.reset();
      this.onClose.emit();
    });
  }

  cancel(): void {
    this.reset();
    this.onClose.emit();
  }

  private createRequest(draft: AddPinDraft): CreatePinRequest | null {
    const tags = draft.tags
      .split(',')
      .map((tag) => tag.trim().toLocaleLowerCase('de'))
      .filter(Boolean);
    if (draft.type === 'link') {
      const preview = this.parser.preview();
      const data: LinkPinData = preview ?? {
        url: draft.url.trim(),
        title: draft.url.trim(),
        description: null,
        imageUrl: null,
        siteName: null,
        readingTimeMin: null,
        parseStatus: 'failed',
      };
      return {
        type: 'link',
        data: { ...data, url: draft.url.trim() },
        color: draft.pinColor,
        tags,
      };
    }
    if (draft.type === 'note') {
      const data: NotePinData = { content: draft.content.trim(), color: draft.color };
      return { type: 'note', data, color: draft.pinColor, tags };
    }
    if (draft.type === 'photo' && this.upload.photo()) {
      const photo = this.upload.photo()!;
      const data: PhotoPinData = {
        fileKey: photo.fileKey,
        caption: draft.caption.trim() || null,
        width: photo.width,
        height: photo.height,
        imageUrl: photo.imageUrl,
      };
      return { type: 'photo', data, color: draft.pinColor, tags };
    }
    return null;
  }

  private reset(): void {
    this.draftModel.set(emptyDraft);
    this.parser.reset();
    this.upload.reset();
    this.pins.clearError();
  }
}
