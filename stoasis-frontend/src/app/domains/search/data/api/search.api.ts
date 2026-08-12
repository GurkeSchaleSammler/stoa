import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import { SearchQuery, SearchResult, Tag } from '../models/search.models';

@Injectable({ providedIn: 'root' })
export class SearchApi {
  private readonly http = inject(HttpClient);
  search(query: SearchQuery): Observable<SearchResult[]> {
    let params = new HttpParams().set('q', query.q);
    if (query.type) params = params.set('type', query.type);
    if (query.tag) params = params.set('tag', query.tag);
    return this.http.get<SearchResult[]>(`${API_URL}/search`, { params });
  }
  tags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${API_URL}/tags`);
  }
  createTag(name: string): Observable<Tag> {
    return this.http.post<Tag>(`${API_URL}/tags`, { name });
  }
  deleteTag(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/tags/${id}`);
  }
}
