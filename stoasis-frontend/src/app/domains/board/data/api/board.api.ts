import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import {
  BoardContext,
  CreatePinRequest,
  LinkPreview,
  Pin,
  PinComment,
  UpdatePinRequest,
  UploadedPhoto,
} from '../models/board.models';

@Injectable({ providedIn: 'root' })
export class BoardApi {
  private readonly http = inject(HttpClient);

  context(collectionId: string): Observable<BoardContext> {
    return this.http.get<BoardContext>(`${API_URL}/collections/${collectionId}`);
  }

  list(collectionId: string): Observable<Pin[]> {
    return this.http.get<Pin[]>(`${API_URL}/collections/${collectionId}/pins`);
  }

  create(collectionId: string, body: CreatePinRequest): Observable<Pin> {
    return this.http.post<Pin>(`${API_URL}/collections/${collectionId}/pins`, body);
  }

  update(collectionId: string, pinId: string, body: UpdatePinRequest): Observable<Pin> {
    return this.http.patch<Pin>(`${API_URL}/collections/${collectionId}/pins/${pinId}`, body);
  }

  delete(collectionId: string, pinId: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/collections/${collectionId}/pins/${pinId}`);
  }

  addComment(collectionId: string, pinId: string, body: string): Observable<PinComment> {
    return this.http.post<PinComment>(
      `${API_URL}/collections/${collectionId}/pins/${pinId}/comments`,
      { body },
    );
  }

  parseLink(url: string): Observable<LinkPreview> {
    return this.http.get<LinkPreview>(`${API_URL}/links/preview`, {
      params: new HttpParams().set('url', url),
    });
  }

  upload(file: File): Observable<UploadedPhoto> {
    return this.http.post<UploadedPhoto>(`${API_URL}/uploads`, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': file.name,
      },
    });
  }
}
