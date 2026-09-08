import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CollectionSummary } from '../../collection/data/models/collection-summary';
import { ImportResult } from '../data/models/import-result';
import { ExportFormat } from '../data/models/export-format';
import { ImportReportComponent } from './import-report';

/** Requires preview confirmation and labels export scopes. */
@Component({
  selector: 'ui-import-export',
  imports: [FormsModule, TranslatePipe, ImportReportComponent],
  templateUrl: './import-export.html',
  styleUrls: ['./profile.scss', './portability.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportComponent {
  readonly boards = input<CollectionSummary[]>([]);
  readonly destination = input('');
  readonly premium = input(false);
  readonly preview = input<ImportResult | null>(null);
  readonly importResult = input<ImportResult | null>(null);
  readonly isImporting = input(false);
  readonly isExporting = input(false);
  readonly error = input<string | null>(null);
  readonly onDestination = output<string>();
  readonly onImportFile = output<File>();
  readonly onConfirm = output<void>();
  readonly onCancel = output<void>();
  readonly onExport = output<{ format: ExportFormat; scope: 'boards' | 'account' }>();

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.onImportFile.emit(file);
    input.value = '';
  }
}
