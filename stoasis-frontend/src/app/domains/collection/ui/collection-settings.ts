import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { PinType } from '../../../shared/models/pin-type';
import { CollectionDetail } from '../data/models/collection-detail';
import { UpdateCollectionRequest } from '../data/models/update-collection-request';

/** Presents board settings with owner-only sharing controls. */
@Component({
  selector: 'ui-collection-settings',
  standalone: true,
  imports: [FormsModule, TranslatePipe, AppIconComponent],
  template: `
    @if (collection(); as item) {
      <section class="panel-card settings-card" aria-labelledby="settings-title">
        <div class="eyebrow">{{ 'collection.singular' | translate }}</div>
        <h1 id="settings-title">
          {{ 'collection.settingsFor' | translate: { name: item.name } }}
        </h1>
        @if (error()) {
          <p class="error-banner" role="alert">{{ error() | translate }}</p>
        }
        <div class="form-grid">
          <label class="emoji-field"
            ><span>{{ 'common.emoji' | translate }}</span
            ><input [ngModel]="item.emoji" (ngModelChange)="onFieldChange.emit({ emoji: $event })"
          /></label>
          <label
            ><span>{{ 'common.name' | translate }}</span
            ><input [ngModel]="item.name" (ngModelChange)="onFieldChange.emit({ name: $event })"
          /></label>
        </div>
        <fieldset>
          <legend>{{ 'collection.allowedPinTypes' | translate }}</legend>
          <div class="check-list">
            @for (type of pinTypes; track type.value) {
              <label>
                <input
                  type="checkbox"
                  [checked]="item.allowedTypes.includes(type.value)"
                  (change)="onTypeToggle.emit(type.value)"
                />
                <span>{{ type.labelKey | translate }}</span>
              </label>
            }
          </div>
        </fieldset>
        @if (item.visibility !== 'private' && item.currentUserRole === 'owner') {
          <section class="share-panel" aria-labelledby="share-panel-title">
            <div>
              <strong id="share-panel-title">{{ 'collection.shareBoard' | translate }}</strong>
              <p>
                {{
                  (item.visibility === 'public'
                    ? 'collection.publicShareHint'
                    : 'collection.linkShareHint'
                  ) | translate
                }}
              </p>
            </div>
            @if (shareUrl()) {
              <label class="share-url">
                <span>{{ 'collection.shareUrl' | translate }}</span>
                <input [value]="shareUrl()" readonly />
              </label>
              <div class="share-actions">
                <button type="button" class="button secondary" (click)="copyShareRequested.emit()">
                  <ui-app-icon name="copy" /> {{ 'common.copy' | translate }}
                </button>
                <button type="button" class="button secondary" (click)="openShareRequested.emit()">
                  <ui-app-icon name="external" /> {{ 'collection.openSharedView' | translate }}
                </button>
              </div>
            } @else {
              <p class="share-pending">
                <ui-app-icon name="warning" /> {{ 'collection.saveToShare' | translate }}
              </p>
            }
          </section>
        }
        <fieldset>
          <legend>{{ 'collection.visibility' | translate }}</legend>
          <div class="segmented wide">
            <button
              type="button"
              [class.active]="item.visibility === 'private'"
              [disabled]="isVisibilityOptionDisabled('private')"
              (click)="onFieldChange.emit({ visibility: 'private' })"
            >
              {{ 'collection.private' | translate }}
            </button>
            <button
              type="button"
              [class.active]="item.visibility === 'link'"
              [disabled]="isVisibilityOptionDisabled('link')"
              (click)="onFieldChange.emit({ visibility: 'link' })"
            >
              {{ 'collection.viaLink' | translate }}
            </button>
            <button
              type="button"
              [class.active]="item.visibility === 'public'"
              [disabled]="isVisibilityOptionDisabled('public')"
              (click)="onFieldChange.emit({ visibility: 'public' })"
            >
              {{ 'collection.public' | translate }}
            </button>
          </div>
        </fieldset>
        <div class="panel-actions split">
          <button
            type="button"
            class="button danger-ghost"
            [disabled]="item.currentUserRole !== 'owner'"
            (click)="onDelete.emit()"
          >
            <ui-app-icon name="trash" /> {{ 'collection.delete' | translate }}
          </button>
          <div>
            <button type="button" class="button secondary" (click)="onCancel.emit()">
              {{ 'common.back' | translate }}
            </button>
            <button
              type="button"
              class="button primary"
              [disabled]="!canSave() || isSaving()"
              (click)="onSave.emit()"
            >
              {{ (isSaving() ? 'common.saving' : 'common.save') | translate }}
            </button>
          </div>
        </div>
      </section>
    }
  `,
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSettingsComponent {
  readonly collection = input<CollectionDetail | null>(null);
  readonly shareUrl = input('');
  readonly canSave = input(false);
  readonly isSaving = input(false);
  readonly error = input<string | null>(null);
  readonly onFieldChange = output<UpdateCollectionRequest>();
  readonly onTypeToggle = output<PinType>();
  readonly onSave = output<void>();
  readonly onDelete = output<void>();
  readonly onCancel = output<void>();
  readonly copyShareRequested = output<void>();
  readonly openShareRequested = output<void>();
  readonly pinTypes: { value: PinType; labelKey: string }[] = [
    { value: 'link', labelKey: 'pin.types.links' },
    { value: 'note', labelKey: 'pin.types.notes' },
    { value: 'photo', labelKey: 'pin.types.photos' },
    { value: 'portal', labelKey: 'pin.types.portals' },
  ];

  isVisibilityOptionDisabled(_value: 'private' | 'link' | 'public'): boolean {
    return this.collection()?.currentUserRole !== 'owner';
  }
}
