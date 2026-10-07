import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { AppIconName } from '../../../shared/models/app-icon-name';
import { PinType } from '../../../shared/models/pin-type';
import { AddPinDraft } from '../data/models/add-pin-draft';
import { NOTE_BACKGROUND_PRESETS } from '../data/models/board-color';
import { LinkPreview } from '../data/models/link-preview';
import { UploadedPhoto } from '../data/models/uploaded-photo';
import { BoardColorPickerComponent } from './board-color-picker';
import { WorldDetail } from '../../world/data/world.models';

/** Collects pin content and displays upload validation and progress. */
@Component({
  selector: 'ui-add-pin-dialog',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent, BoardColorPickerComponent],
  template: `
    @if (isOpen()) {
      <div class="dialog-backdrop" (click)="onCancel.emit()">
        <section
          class="dialog-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-pin-title"
          (click)="$event.stopPropagation()"
        >
          <header>
            <div>
              <p class="eyebrow">{{ 'pin.new' | translate }}</p>
              <h1 id="add-pin-title">{{ 'pin.addTitle' | translate }}</h1>
            </div>
            <button
              type="button"
              class="close-button"
              [attr.aria-label]="'common.close' | translate"
              (click)="onCancel.emit()"
            >
              <ui-app-icon name="close" />
            </button>
          </header>
          @if (error()) {
            <p class="dialog-error" role="alert">{{ error() | translate }}</p>
          }
          <div class="pin-type-picker">
            @for (type of typeOptions; track type.value) {
              @if (allowedTypes().includes(type.value)) {
                <button
                  type="button"
                  [class.active]="selectedType() === type.value"
                  (click)="onTypeSelect.emit(type.value)"
                >
                  <span><ui-app-icon [name]="type.icon" /></span
                  ><strong>{{ type.labelKey | translate }}</strong>
                </button>
              }
            }
          </div>
          @switch (selectedType()) {
            @case ('link') {
              <label class="dialog-field"
                ><span>{{ 'pin.address' | translate }}</span
                ><input
                  type="url"
                  placeholder="https://…"
                  [ngModel]="draft().url"
                  (ngModelChange)="onDraftChange.emit({ url: $event })"
                  (blur)="onUrlChange.emit(draft().url)"
              /></label>
              @if (isParsing()) {
                <p class="helper">{{ 'pin.loadingPreview' | translate }}</p>
              }
              @if (preview(); as link) {
                <div class="link-preview">
                  @if (link.imageUrl) {
                    <img
                      [src]="link.imageUrl"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      referrerpolicy="no-referrer"
                    />
                  } @else {
                    <span class="link-preview-icon"><ui-app-icon name="link" /></span>
                  }
                  <div>
                    <strong>{{ link.title }}</strong
                    ><small>{{ link.siteName || link.url }}</small>
                  </div>
                </div>
              }
            }
            @case ('note') {
              <label class="dialog-field"
                ><span>{{ 'pin.note' | translate }}</span
                ><textarea
                  rows="7"
                  [placeholder]="'pin.notePlaceholder' | translate"
                  [ngModel]="draft().content"
                  (ngModelChange)="onDraftChange.emit({ content: $event })"
                ></textarea>
              </label>
              <ui-board-color-picker
                labelKey="pin.backgroundColor"
                [value]="draft().color"
                [presetColors]="backgroundColors"
                [allowCustom]="allowCustomColors()"
                (valueChange)="onDraftChange.emit({ color: $event })"
              />
            }
            @case ('photo') {
              <label class="file-drop"
                ><input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="selectFile($event)"
                />
                <span><ui-app-icon name="upload" /></span
                ><strong>{{ 'pin.choosePhoto' | translate }}</strong
                ><small>{{ 'pin.photoFormats' | translate }}</small></label
              >
              @if (isUploading()) {
                <progress
                  [value]="uploadProgress()"
                  max="100"
                  [attr.aria-label]="
                    'pin.uploadProgress' | translate: { progress: uploadProgress() }
                  "
                ></progress>
                <p class="helper">
                  {{ 'pin.uploadProgress' | translate: { progress: uploadProgress() } }}
                </p>
              }
              @if (uploadedFileName()) {
                <p class="file-name"><ui-app-icon name="check" /> {{ uploadedFileName() }}</p>
              }
              @if (localPreview() && !uploadedPhoto()) {
                <figure class="upload-preview">
                  <img
                    [src]="localPreview()"
                    [alt]="draft().caption || ('pin.imagePreview' | translate)"
                  />
                </figure>
              }
              @if (uploadedPhoto(); as photo) {
                <figure class="upload-preview">
                  @if (photo.imageUrl) {
                    <img
                      [src]="photo.imageUrl"
                      [alt]="draft().caption || ('pin.imagePreview' | translate)"
                      loading="lazy"
                      decoding="async"
                    />
                  } @else {
                    <ui-app-icon name="image" />
                  }
                  <figcaption>{{ photo.originalName }}</figcaption>
                </figure>
              }
              <label class="dialog-field"
                ><span>{{ 'pin.caption' | translate }}</span
                ><input
                  [ngModel]="draft().caption"
                  (ngModelChange)="onDraftChange.emit({ caption: $event })"
              /></label>
            }
            @case ('portal') {
              @if (portalWorlds().length === 0) {
                <div class="dialog-empty">
                  <ui-app-icon name="map" />
                  <strong>{{ 'pin.noPortalWorld' | translate }}</strong>
                  <p>{{ 'pin.noPortalWorldLead' | translate }}</p>
                </div>
              } @else {
                <label class="dialog-field"
                  ><span>{{ 'pin.portalWorld' | translate }}</span>
                  <select
                    [ngModel]="draft().portalWorldId"
                    (ngModelChange)="selectPortalWorld($event)"
                  >
                    @for (world of portalWorlds(); track world.id) {
                      <option [value]="world.id">{{ world.emoji }} {{ world.name }}</option>
                    }
                  </select>
                </label>
                <label class="dialog-field"
                  ><span>{{ 'pin.portalTarget' | translate }}</span>
                  <select
                    [ngModel]="draft().portalTargetCollectionId"
                    (ngModelChange)="selectPortalTarget($event)"
                  >
                    @for (board of portalTargets(); track board.id) {
                      <option [value]="board.id">{{ board.emoji }} {{ board.name }}</option>
                    }
                  </select>
                </label>
                <div class="portal-appearance">
                  <label class="dialog-field emoji"
                    ><span>{{ 'worlds.symbol' | translate }}</span
                    ><input
                      maxlength="32"
                      [ngModel]="draft().portalEmoji"
                      (ngModelChange)="onDraftChange.emit({ portalEmoji: $event })"
                  /></label>
                  <label class="dialog-field"
                    ><span>{{ 'pin.portalLabel' | translate }}</span
                    ><input
                      maxlength="180"
                      [ngModel]="draft().portalLabel"
                      (ngModelChange)="onDraftChange.emit({ portalLabel: $event })"
                  /></label>
                </div>
                <label class="portal-return">
                  <input
                    type="checkbox"
                    [ngModel]="draft().createReturnPortal"
                    (ngModelChange)="onDraftChange.emit({ createReturnPortal: $event })"
                  />
                  <span
                    ><strong>{{ 'pin.returnPortal' | translate }}</strong
                    ><small>{{ 'pin.returnPortalLead' | translate }}</small></span
                  >
                </label>
              }
            }
          }
          @if (selectedType()) {
            <ui-board-color-picker
              labelKey="pin.pinColor"
              [value]="draft().pinColor"
              [allowClear]="true"
              [allowCustom]="allowCustomColors()"
              (valueChange)="onDraftChange.emit({ pinColor: $event })"
              (clear)="onDraftChange.emit({ pinColor: null })"
            />
            <label class="dialog-field"
              ><span
                >{{ 'common.tags' | translate }}
                <small>({{ 'pin.separateWithComma' | translate }})</small></span
              ><input
                [placeholder]="'pin.tagsPlaceholder' | translate"
                [ngModel]="draft().tags"
                (ngModelChange)="onDraftChange.emit({ tags: $event })"
            /></label>
          }
          <footer>
            <button type="button" class="button secondary" (click)="onCancel.emit()">
              {{ 'common.cancel' | translate }}</button
            ><button
              type="button"
              class="button primary"
              [disabled]="
                !canSubmit() || isUploading() || (selectedType() === 'link' && isParsing())
              "
              (click)="onSubmit.emit()"
            >
              {{ 'pin.add' | translate }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styleUrls: ['./board.scss', './add-pin-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPinDialogComponent {
  readonly localPreview = input<string | null>(null);
  readonly isOpen = input(false);
  readonly allowedTypes = input.required<PinType[]>();
  readonly selectedType = input<PinType | null>(null);
  readonly draft = input.required<AddPinDraft>();
  readonly preview = input<LinkPreview | null>(null);
  readonly canSubmit = input(false);
  readonly isUploading = input(false);
  readonly isParsing = input(false);
  readonly uploadProgress = input(0);
  readonly uploadedFileName = input<string | null>(null);
  readonly uploadedPhoto = input<UploadedPhoto | null>(null);
  readonly error = input<string | null>(null);
  readonly allowCustomColors = input(false);
  readonly portalWorlds = input<WorldDetail[]>([]);
  readonly sourceCollectionId = input('');
  readonly onTypeSelect = output<PinType>();
  readonly onUrlChange = output<string>();
  readonly onFileSelect = output<File>();
  readonly onDraftChange = output<Partial<AddPinDraft>>();
  readonly onSubmit = output<void>();
  readonly onCancel = output<void>();
  readonly typeOptions: { value: PinType; labelKey: string; icon: AppIconName }[] = [
    { value: 'link', labelKey: 'pin.link', icon: 'link' },
    { value: 'note', labelKey: 'pin.note', icon: 'note' },
    { value: 'photo', labelKey: 'pin.photo', icon: 'image' },
    { value: 'portal', labelKey: 'pin.portal', icon: 'door' },
  ];
  readonly backgroundColors = NOTE_BACKGROUND_PRESETS;
  selectFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.onFileSelect.emit(file);
  }
  portalTargets() {
    return (
      this.portalWorlds().find((world) => world.id === this.draft().portalWorldId)?.boards ?? []
    ).filter((board) => board.id !== this.sourceCollectionId());
  }
  selectPortalWorld(worldId: string): void {
    const target = this.portalWorlds()
      .find((world) => world.id === worldId)
      ?.boards.find((board) => board.id !== this.sourceCollectionId());
    this.onDraftChange.emit({
      portalWorldId: worldId,
      portalTargetCollectionId: target?.id ?? '',
      portalLabel: target?.name ?? '',
      portalEmoji: target?.emoji ?? '↗',
    });
  }
  selectPortalTarget(collectionId: string): void {
    const target = this.portalTargets().find((board) => board.id === collectionId);
    this.onDraftChange.emit({
      portalTargetCollectionId: collectionId,
      portalLabel: target?.name ?? '',
      portalEmoji: target?.emoji ?? '↗',
    });
  }
}
