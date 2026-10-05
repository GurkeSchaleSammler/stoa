import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import { Pin } from '../../../../shared/models/pin';
import { PublicCollection } from '../models/public-collection';

@Injectable({ providedIn: 'root' })
export class PublicCollectionApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/public/collections`;

  detail(id: string, token?: string): Observable<PublicCollection> {
    return this.http.get<PublicCollection>(`${this.base}/${id}`, { params: this.params(token) });
  }

  pins(id: string, token?: string): Observable<Pin[]> {
    return this.http.get<Pin[]>(`${this.base}/${id}/pins`, { params: this.params(token) });
  }

  private params(token?: string): HttpParams {
    return token ? new HttpParams().set('token', token) : new HttpParams();
  }
}
