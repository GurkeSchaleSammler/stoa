import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { ImportService } from '../data/application/import.service';
import { ProfileService } from '../data/application/profile.service';
import { ImportExportComponent } from '../ui/import-export';
import { SnackbarService } from '../../../shared/application/snackbar.service';
import { ExportFormat } from '../data/models/export-format';

@Component({
  selector: 'feature-import-export-handler',
  standalone: true,
  imports: [ImportExportComponent],
  template: `<ui-import-export
    [importResult]="imports.result()"
    [isImporting]="imports.isImporting()"
    [isExporting]="isExporting()"
    (onImportFile)="imports.importPocketCsv($event)"
    (onExport)="exportData($event)"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportHandlerComponent {
  protected readonly imports = inject(ImportService);
  private readonly profile = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbars = inject(SnackbarService);
  readonly isExporting = signal(false);
  exportData(format: ExportFormat): void {
    this.isExporting.set(true);
    this.profile
      .exportData(format)
      .pipe(
        tap((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `stoa-export.${format}`;
          link.click();
          URL.revokeObjectURL(url);
          this.snackbars.success('snackbar.exportCompleted');
        }),
        catchError(() => {
          this.snackbars.error('errors.export');
          return EMPTY;
        }),
        finalize(() => this.isExporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
