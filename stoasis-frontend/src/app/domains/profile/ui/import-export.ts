import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ImportResult } from '../data/models/import-result';
import { ExportFormat } from '../data/models/export-format';

@Component({
  selector: 'ui-import-export',
  standalone: true,
  imports: [TranslatePipe],
  template: `<section class="settings-section stack">
    <div>
      <p class="eyebrow">{{ 'profile.data' | translate }}</p>
      <h2>{{ 'profile.importExport' | translate }}</h2>
      <p>{{ 'profile.importExportLead' | translate }}</p>
    </div>
    <div class="data-actions">
      <label class="button secondary file-button disabled" aria-disabled="true"
        ><input type="file" accept=".csv,text/csv" disabled />{{
          (isImporting() ? 'profile.importing' : 'profile.importPocket') | translate
        }}</label
      ><button type="button" class="button secondary" disabled (click)="onExport.emit('json')">
        {{ 'profile.exportJson' | translate }}</button
      ><button type="button" class="button secondary" disabled (click)="onExport.emit('csv')">
        {{ 'profile.exportCsv' | translate }}
      </button>
    </div>
    @if (importResult(); as result) {
      <div class="import-result">
        <strong>{{ 'profile.importedCount' | translate: { count: result.imported } }}</strong
        ><span>{{ 'profile.skippedCount' | translate: { count: result.skipped } }}</span>
        @for (error of result.errors; track error) {
          <small>{{ error }}</small>
        }
      </div>
    }
  </section>`,
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportComponent {
  readonly importResult = input<ImportResult | null>(null);
  readonly isImporting = input(false);
  readonly isExporting = input(false);
  readonly onImportFile = output<File>();
  readonly onExport = output<ExportFormat>();
  selectFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.onImportFile.emit(file);
  }
}
