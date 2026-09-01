export interface StoaQlOperation {
  statementIndex: number;
  type: string;
  entityId?: string | null;
  data?: unknown;
}

export interface StoaQlResult {
  statementIndex: number;
  type: string;
  data: unknown;
}

export interface StoaQlQueryResponse {
  success: true;
  queryId: string;
  languageVersion: string;
  dryRun: boolean;
  operations: StoaQlOperation[];
  results: StoaQlResult[];
  aliases: Record<string, string>;
  warnings: string[];
  durationMs: number;
}

export interface StoaQlQueryError {
  code: string;
  message: string;
  line: number;
  column: number;
  statementIndex?: number | null;
  hint?: string | null;
}

export interface StoaQlHistoryItem {
  id: string;
  queryId?: string | null;
  query: string;
  languageVersion: string;
  dryRun: boolean;
  success: boolean;
  operationCount: number;
  resultCount: number;
  durationMs?: number | null;
  errorCode?: string | null;
  createdAt: string;
}
