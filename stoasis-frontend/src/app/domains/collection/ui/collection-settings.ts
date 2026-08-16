import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AppIconComponent } from '../../../shared/ui/app-icon';
import { PinType } from '../../../shared/models/pin-type';
import { CollectionDetail } from '../data/models/collection-detail';
import { UpdateCollectionRequest } from '../data/models/update-collection-request';

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
        <fieldset>
          <legend>{{ 'collection.visibility' | translate }}</legend>
          <div class="segmented wide">
            <button
              type="button"
              [class.active]="item.visibility === 'private'"
              (click)="onFieldChange.emit({ visibility: 'private' })"
            >
              {{ 'collection.private' | translate }}
            </button>
            <button
              type="button"
              [class.active]="item.visibility === 'link'"
              (click)="onFieldChange.emit({ visibility: 'link' })"
            >
              {{ 'collection.viaLink' | translate }}
            </button>
          </div>
          @if (item.visibility === 'link' && item.inviteToken) {
            <div class="invite-box">
              <code>{{ inviteUrl() }}</code
              ><button type="button" (click)="onCopyInvite.emit()">
                <ui-app-icon name="copy" /> {{ 'common.copy' | translate }}
              </button>
            </div>
          }
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
  readonly inviteUrl = input('');
  readonly canSave = input(false);
  readonly isSaving = input(false);
  readonly error = input<string | null>(null);
  readonly onFieldChange = output<UpdateCollectionRequest>();
  readonly onTypeToggle = output<PinType>();
  readonly onSave = output<void>();
  readonly onDelete = output<void>();
  readonly onCancel = output<void>();
  readonly onCopyInvite = output<void>();
  readonly pinTypes: { value: PinType; labelKey: string }[] = [
    { value: 'link', labelKey: 'pin.types.links' },
    { value: 'note', labelKey: 'pin.types.notes' },
    { value: 'photo', labelKey: 'pin.types.photos' },
  ];
}
