import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionService } from '../data/application/collection.service';
import { CollectionSettingsComponent } from '../ui/collection-components';
import { ConfirmationDialogService } from '../../../shared/application/confirmation-dialog.service';
import { PinType } from '../../../shared/models/pin-type';
import { UpdateCollectionRequest } from '../data/models/update-collection-request';

@Component({
  selector: 'feature-collection-settings-handler',
  standalone: true,
  imports: [CollectionSettingsComponent],
  template: `
    <ui-collection-settings
      [collection]="collections.activeCollection()"
      [inviteUrl]="inviteUrl()"
      [canSave]="canSave()"
      [isSaving]="collections.isSaving()"
      [error]="collections.error()"
      (onFieldChange)="changeFields($event)"
      (onTypeToggle)="toggleType($event)"
      (onSave)="save()"
      (onDelete)="deleteCollection()"
      (onCancel)="back()"
      (onCopyInvite)="copyInvite()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSettingsHandlerComponent {
  protected readonly collections = inject(CollectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly collectionId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly pendingModel = signal<UpdateCollectionRequest>({});
  readonly settingsForm = form(this.pendingModel);
  readonly canSave = computed(() => {
    const changes = this.pendingModel();
    if (Object.keys(changes).length === 0) return false;
    if (changes.name !== undefined && changes.name.trim().length === 0) return false;
    if (changes.allowedTypes !== undefined && changes.allowedTypes.length === 0) return false;
    return true;
  });
  readonly inviteUrl = computed(() => {
    const token = this.collections.activeCollection()?.inviteToken;
    return token ? `${window.location.origin}/join/${token}` : '';
  });

  constructor() {
    this.collections.loadCollection(this.collectionId);
  }
  changeFields(changes: UpdateCollectionRequest): void {
    this.pendingModel.update((current) => ({ ...current, ...changes }));
  }
  toggleType(type: PinType): void {
    const active =
      this.pendingModel().allowedTypes ?? this.collections.activeCollection()?.allowedTypes ?? [];
    const next = active.includes(type) ? active.filter((item) => item !== type) : [...active, type];
    this.changeFields({ allowedTypes: next });
  }
  save(): void {
    if (!this.canSave()) return;
    this.collections.update(this.collectionId, this.pendingModel(), () => {
      this.pendingModel.set({});
      this.back();
    });
  }
  async deleteCollection(): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'collection.deleteTitle',
      message: 'collection.confirmDelete',
      confirmLabel: 'common.delete',
      tone: 'danger',
    });
    if (confirmed) this.collections.delete(this.collectionId);
  }
  back(): void {
    void this.router.navigate(['/collections', this.collectionId]);
  }
  copyInvite(): void {
    void navigator.clipboard.writeText(this.inviteUrl());
  }
}
