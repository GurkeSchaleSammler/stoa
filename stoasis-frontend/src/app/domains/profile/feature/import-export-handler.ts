import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CollectionApi } from '../../collection/data/api/collection.api';
import { CollectionSummary } from '../../collection/data/models/collection-summary';
import { SessionContextStore } from '../../../shared/application/session-context.store';
import { ImportService } from '../data/application/import.service';
import { ProfileService } from '../data/application/profile.service';
import { ImportExportComponent } from '../ui/import-export';
import { ExportFormat } from '../data/models/export-format';

/** Coordinates preview confirmation and downloadable exports. */
@Component({
  selector: 'feature-import-export-handler',
  imports: [ImportExportComponent],
  providers: [ImportService],
  template: `<ui-import-export
    [boards]="boards()"
    [destination]="destination()"
    [premium]="premium()"
    [preview]="imports.preview()"
    [importResult]="imports.result()"
    [isImporting]="imports.isImporting()"
    [isExporting]="isExporting()"
    [error]="imports.error() || error()"
    (onDestination)="selectDestination($event)"
    (onImportFile)="imports.previewFile($event, destination())"
    (onConfirm)="imports.confirm()"
    (onCancel)="imports.reset()"
    (onExport)="exportData($event.format, $event.scope)"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportHandlerComponent {
  protected readonly imports = inject(ImportService);
  private readonly profile = inject(ProfileService);
  private readonly collections = inject(CollectionApi);
  private readonly session = inject(SessionContextStore);
  readonly boards = signal<CollectionSummary[]>([]);
  readonly destination = signal('');
  readonly isExporting = signal(false);
  readonly error = signal<string | null>(null);
  readonly premium = computed(() => this.session.user()?.plan === 'premium');

  constructor() {
    void this.loadBoards();
  }

  selectDestination(id: string): void {
    this.destination.set(id);
    this.imports.reset();
  }

  async exportData(format: ExportFormat, scope: 'boards' | 'account'): Promise<void> {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.error.set(null);
    try {
      const blob = await firstValueFrom(this.profile.exportData(format, scope));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stoasis-${scope}.${format}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      const body = (error as { error?: unknown })?.error;
      const message = body instanceof Blob ? await body.text() : '';
      try {
        this.error.set(JSON.parse(message).message ?? 'errors.export');
      } catch {
        this.error.set('errors.export');
      }
    } finally {
      this.isExporting.set(false);
    }
  }

  private async loadBoards(): Promise<void> {
    try {
      const boards = await firstValueFrom(this.collections.list('all'));
      this.boards.set(
        boards.filter(
          (board) =>
            !board.isSystem &&
            board.allowedTypes.includes('link') &&
            board.members.some(
              (member) => member.userId === this.session.userId() && member.role !== 'viewer',
            ),
        ),
      );
    } catch {
      this.error.set('errors.collection');
    }
  }
}
