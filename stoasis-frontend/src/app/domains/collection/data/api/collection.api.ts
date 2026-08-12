import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import {
  CollectionDetail,
  CollectionFilter,
  CollectionSummary,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from '../models/collection.models';

@Injectable({ providedIn: 'root' })
export class CollectionApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/collections`;

  list(filter: CollectionFilter): Observable<CollectionSummary[]> {
    return this.http.get<CollectionSummary[]>(this.base, {
      params: new HttpParams().set('filter', filter),
    });
  }

  detail(id: string): Observable<CollectionDetail> {
    return this.http.get<CollectionDetail>(`${this.base}/${id}`);
  }

  create(body: CreateCollectionRequest): Observable<CollectionDetail> {
    return this.http.post<CollectionDetail>(this.base, body);
  }

  update(id: string, body: UpdateCollectionRequest): Observable<CollectionDetail> {
    return this.http.patch<CollectionDetail>(`${this.base}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  join(inviteToken: string): Observable<{ collectionId: string }> {
    return this.http.post<{ collectionId: string }>(`${this.base}/join/${inviteToken}`, {});
  }
}
