import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import { StoaQlHistoryItem, StoaQlQueryResponse } from '../models/stoaql-query';

@Injectable({ providedIn: 'root' })
export class StoaQlApi {
  private readonly http = inject(HttpClient);

  execute(collectionId: string, query: string, dryRun: boolean): Observable<StoaQlQueryResponse> {
    return this.http.post<StoaQlQueryResponse>(`${API_URL}/v1/query`, {
      query,
      languageVersion: '1.0',
      dryRun,
      atomic: true,
      return: 'operations',
      context: { collectionId },
    });
  }

  history(collectionId: string, limit = 30): Observable<StoaQlHistoryItem[]> {
    return this.http.get<StoaQlHistoryItem[]>(`${API_URL}/v1/query/history`, {
      params: { collectionId, limit },
    });
  }

  clearHistory(collectionId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/v1/query/history`, {
      params: { collectionId },
    });
  }
}
