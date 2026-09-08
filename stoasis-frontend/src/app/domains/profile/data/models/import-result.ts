/** Provides aggregate counts and the outcome of every CSV row. */
export interface ImportResult {
  imported: number;
  skipped: number;
  duplicates: number;
  failed: number;
  ready: number;
  errors: string[];
  rows: ImportRow[];
}

/** Holds safe text for preview and import reporting. */
export interface ImportRow {
  row: number;
  title: string;
  url: string | null;
  status: 'ready' | 'created' | 'skipped' | 'duplicate' | 'failed';
  message: string | null;
}
