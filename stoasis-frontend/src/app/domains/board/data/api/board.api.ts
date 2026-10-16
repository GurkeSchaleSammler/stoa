import { HttpClient, HttpParams, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../shared/api/api-url';
import { BoardContext } from '../models/board-context';
import { Pin } from '../../../../shared/models/pin';
import { BoardElements } from '../models/board-elements';
import { CreatePinRequest } from '../models/create-pin-request';
import { UpdatePinRequest } from '../models/update-pin-request';
import { PinComment } from '../../../../shared/models/pin-comment';
import { LinkPreview } from '../models/link-preview';
import { UploadedPhoto } from '../models/uploaded-photo';
import { StackBlock } from '../models/stack-block';
import { BoardColorVariant } from '../models/board-color-variant';
import { ConnectorThread } from '../models/connector-thread';
import { CreateSoftZoneRequest } from '../models/create-soft-zone-request';
import { SoftZone } from '../models/soft-zone';
import { CreateFloatingLabelRequest } from '../models/create-floating-label-request';
import { FloatingLabel } from '../models/floating-label';
import { CreateStickerRequest } from '../models/create-sticker-request';
import { StickerElement } from '../models/sticker-element';
import { UpdateStickerRequest } from '../models/update-sticker-request';

/** Connects board actions and image uploads to the API. */
@Injectable({ providedIn: 'root' })
export class BoardApi {
  private readonly http = inject(HttpClient);

  context(collectionId: string): Observable<BoardContext> {
    return this.http.get<BoardContext>(`${API_URL}/collections/${collectionId}`);
  }

  list(collectionId: string): Observable<Pin[]> {
    return this.http.get<Pin[]>(`${API_URL}/collections/${collectionId}/pins`);
  }

  elements(collectionId: string): Observable<BoardElements> {
    return this.http.get<BoardElements>(`${API_URL}/collections/${collectionId}/board-elements`);
  }

  create(collectionId: string, body: CreatePinRequest): Observable<Pin> {
    return this.http.post<Pin>(`${API_URL}/collections/${collectionId}/pins`, body);
  }

  copyPin(collectionId: string, sourceCollectionId: string, pinId: string): Observable<Pin> {
    return this.http.post<Pin>(`${API_URL}/collections/${collectionId}/pins/copy`, {
      sourceCollectionId,
      pinId,
    });
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

  upload(file: File): Observable<HttpEvent<UploadedPhoto>> {
    return this.http.post<UploadedPhoto>(`${API_URL}/uploads`, file, {
      observe: 'events',
      reportProgress: true,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': file.name,
      },
    });
  }

  discardUpload(key: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/uploads/${key}`);
  }

  createStack(
    collectionId: string,
    sourcePinId: string,
    targetPinId: string,
  ): Observable<StackBlock> {
    return this.http.post<StackBlock>(
      `${API_URL}/collections/${collectionId}/board-elements/stacks`,
      {
        sourcePinId,
        targetPinId,
      },
    );
  }

  addStackChild(collectionId: string, stackId: string, pinId: string): Observable<StackBlock> {
    return this.http.post<StackBlock>(
      `${API_URL}/collections/${collectionId}/board-elements/stacks/${stackId}/children/${pinId}`,
      {},
    );
  }

  updateStack(
    collectionId: string,
    stackId: string,
    body: Partial<Pick<StackBlock, 'x' | 'y' | 'layer' | 'expanded'>>,
  ): Observable<StackBlock> {
    return this.http.patch<StackBlock>(
      `${API_URL}/collections/${collectionId}/board-elements/stacks/${stackId}`,
      body,
    );
  }

  releaseStackChild(
    collectionId: string,
    stackId: string,
    body: { pinId: string; x: number; y: number; layer: number },
  ): Observable<BoardElements> {
    return this.http.post<BoardElements>(
      `${API_URL}/collections/${collectionId}/board-elements/stacks/${stackId}/release`,
      body,
    );
  }

  dissolveStack(collectionId: string, stackId: string): Observable<BoardElements> {
    return this.http.delete<BoardElements>(
      `${API_URL}/collections/${collectionId}/board-elements/stacks/${stackId}`,
    );
  }

  createConnector(
    collectionId: string,
    sourcePinId: string,
    targetPinId: string,
    colorVariant: BoardColorVariant = 'accent',
  ): Observable<ConnectorThread> {
    return this.http.post<ConnectorThread>(
      `${API_URL}/collections/${collectionId}/board-elements/connectors`,
      { sourcePinId, targetPinId, colorVariant },
    );
  }

  updateConnector(
    collectionId: string,
    connectorId: string,
    colorVariant?: BoardColorVariant,
    label?: string,
  ): Observable<ConnectorThread> {
    return this.http.patch<ConnectorThread>(
      `${API_URL}/collections/${collectionId}/board-elements/connectors/${connectorId}`,
      { colorVariant, label },
    );
  }

  deleteConnector(collectionId: string, connectorId: string): Observable<void> {
    return this.http.delete<void>(
      `${API_URL}/collections/${collectionId}/board-elements/connectors/${connectorId}`,
    );
  }

  createZone(collectionId: string, body: CreateSoftZoneRequest): Observable<SoftZone> {
    return this.http.post<SoftZone>(
      `${API_URL}/collections/${collectionId}/board-elements/zones`,
      body,
    );
  }

  updateZone(
    collectionId: string,
    zoneId: string,
    body: Partial<CreateSoftZoneRequest>,
  ): Observable<SoftZone> {
    return this.http.patch<SoftZone>(
      `${API_URL}/collections/${collectionId}/board-elements/zones/${zoneId}`,
      body,
    );
  }

  deleteZone(collectionId: string, zoneId: string): Observable<void> {
    return this.http.delete<void>(
      `${API_URL}/collections/${collectionId}/board-elements/zones/${zoneId}`,
    );
  }

  createLabel(collectionId: string, body: CreateFloatingLabelRequest): Observable<FloatingLabel> {
    return this.http.post<FloatingLabel>(
      `${API_URL}/collections/${collectionId}/board-elements/labels`,
      body,
    );
  }

  updateLabel(
    collectionId: string,
    labelId: string,
    body: Partial<CreateFloatingLabelRequest>,
  ): Observable<FloatingLabel> {
    return this.http.patch<FloatingLabel>(
      `${API_URL}/collections/${collectionId}/board-elements/labels/${labelId}`,
      body,
    );
  }

  deleteLabel(collectionId: string, labelId: string): Observable<void> {
    return this.http.delete<void>(
      `${API_URL}/collections/${collectionId}/board-elements/labels/${labelId}`,
    );
  }

  createSticker(collectionId: string, body: CreateStickerRequest): Observable<StickerElement> {
    return this.http.post<StickerElement>(
      `${API_URL}/collections/${collectionId}/board-elements/stickers`,
      body,
    );
  }

  updateSticker(
    collectionId: string,
    stickerId: string,
    body: UpdateStickerRequest,
  ): Observable<StickerElement> {
    return this.http.patch<StickerElement>(
      `${API_URL}/collections/${collectionId}/board-elements/stickers/${stickerId}`,
      body,
    );
  }

  deleteSticker(collectionId: string, stickerId: string): Observable<void> {
    return this.http.delete<void>(
      `${API_URL}/collections/${collectionId}/board-elements/stickers/${stickerId}`,
    );
  }
}
