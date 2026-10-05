import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionService } from '../data/application/collection.service';
import { CollectionSettingsComponent } from '../ui/collection-settings';
import { ConfirmationDialogService } from '../../../shared/application/confirmation-dialog.service';
import { PinType } from '../../../shared/models/pin-type';
import { UpdateCollectionRequest } from '../data/models/update-collection-request';
import { collectionShareUrl } from '../data/models/collection-share-url';
import { SnackbarService } from '../../../shared/application/snackbar.service';

/** Keeps board settings in a signal draft until they are saved. */
@Component({
  selector: 'feature-collection-settings-handler',
  standalone: true,
  imports: [CollectionSettingsComponent],
  template: `
    <ui-collection-settings
      [collection]="draftCollection()"
      [shareUrl]="shareUrl()"
      [canSave]="canSave()"
      [isSaving]="collections.isSaving()"
      [error]="collections.error()"
      (onFieldChange)="changeFields($event)"
      (onTypeToggle)="toggleType($event)"
      (onSave)="save()"
      (onDelete)="deleteCollection()"
      (onCancel)="back()"
      (onCopyShare)="copyShare()"
      (onOpenShare)="openShare()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSettingsHandlerComponent {
  protected readonly collections = inject(CollectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly snackbars = inject(SnackbarService);
  private readonly collectionId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly pendingModel = signal<UpdateCollectionRequest>({});
  readonly draftCollection = computed(() => {
    const board = this.collections.activeCollection();
    return board ? { ...board, ...this.pendingModel() } : null;
  });
  readonly settingsForm = form(this.pendingModel);
  readonly canSave = computed(() => {
    const changes = this.pendingModel();
    if (Object.keys(changes).length === 0) return false;
    if (changes.name !== undefined && changes.name.trim().length === 0) return false;
    if (changes.allowedTypes !== undefined && changes.allowedTypes.length === 0) return false;
    return true;
  });
  readonly shareUrl = computed(() => {
    const collection = this.collections.activeCollection();
    if (!collection) return '';
    const draftVisibility = this.pendingModel().visibility ?? collection.visibility;
    if (draftVisibility !== collection.visibility) return '';
    return collectionShareUrl(
      window.location.origin,
      collection.id,
      collection.visibility,
      collection.inviteToken,
    );
  });

  constructor() {
    this.collections.loadCollection(this.collectionId);
  }
  async changeFields(changes: UpdateCollectionRequest): Promise<void> {
    if (
      changes.visibility === 'public' &&
      this.draftCollection()?.visibility !== 'public' &&
      !(await this.confirmation.confirm({
        title: 'collection.publicWarningTitle',
        message: 'collection.publicWarningText',
        confirmLabel: 'collection.makePublic',
        tone: 'danger',
      }))
    ) {
      return;
    }
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
  async copyShare(): Promise<void> {
    if (!this.shareUrl()) return;
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.snackbars.success('snackbar.shareLinkCopied');
    } catch {
      this.snackbars.error('errors.copyShareLink');
    }
  }
  openShare(): void {
    if (this.shareUrl()) window.open(this.shareUrl(), '_blank', 'noopener,noreferrer');
  }
}
