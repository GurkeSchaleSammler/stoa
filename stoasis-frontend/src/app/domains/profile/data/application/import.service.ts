import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProfileApi } from '../api/profile.api';
import { ImportResult } from '../models/import-result';

/** Keeps preview and confirmation tied to one file and destination. */
@Injectable()
export class ImportService {
  private readonly api = inject(ProfileApi);
  private file: File | null = null;
  private collectionId = '';
  readonly result = signal<ImportResult | null>(null);
  readonly preview = signal<ImportResult | null>(null);
  readonly isImporting = signal(false);
  readonly error = signal<string | null>(null);

  async previewFile(file: File, collectionId: string): Promise<void> {
    if (this.isImporting()) return;
    this.reset();
    this.file = file;
    this.collectionId = collectionId;
    await this.run(true);
  }

  async confirm(): Promise<void> {
    if (this.isImporting() || !this.preview()?.ready) return;
    await this.run(false);
  }

  reset(): void {
    this.file = null;
    this.preview.set(null);
    this.result.set(null);
    this.error.set(null);
  }

  private async run(preview: boolean): Promise<void> {
    if (!this.file || !this.collectionId) return;
    this.isImporting.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(
        this.api.importPocket(this.file, this.collectionId, preview),
      );
      if (preview) this.preview.set(result);
      else {
        this.result.set(result);
        this.preview.set(null);
        this.file = null;
      }
    } catch (error) {
      this.error.set(
        (error as { error?: { message?: string } })?.error?.message ?? 'errors.pocketImport',
      );
    } finally {
      this.isImporting.set(false);
    }
  }
}
