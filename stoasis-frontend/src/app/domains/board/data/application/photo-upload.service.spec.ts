import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SnackbarService } from '../../../../shared/application/snackbar.service';
import { BoardApi } from '../api/board.api';
import { UploadedPhoto } from '../models/uploaded-photo';
import { PhotoUploadService } from './photo-upload.service';

describe('PhotoUploadService', () => {
  let events: Subject<HttpEvent<UploadedPhoto>>;
  const api = { upload: vi.fn(), discardUpload: vi.fn() };
  let service: PhotoUploadService;

  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL(): string {
          return 'blob:test';
        }
        static override revokeObjectURL(): void {}
      },
    );
    events = new Subject();
    api.upload.mockReset().mockReturnValue(events);
    TestBed.configureTestingModule({
      providers: [
        { provide: BoardApi, useValue: api },
        { provide: SnackbarService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    service = TestBed.inject(PhotoUploadService);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('uses upload events for progress and waits for the server before enabling a photo', () => {
    service.upload(new File(['photo'], 'photo.png', { type: 'image/png' }));
    expect(service.previewUrl()).toBe('blob:test');
    events.next({ type: HttpEventType.UploadProgress, loaded: 25, total: 100 });
    expect(service.progress()).toBe(25);
    expect(service.photo()).toBeNull();
    events.next(
      new HttpResponse({
        body: {
          fileKey: 'upload-1',
          width: 2,
          height: 2,
          imageUrl: '/photo',
          originalName: 'photo.png',
        },
      }),
    );
    events.complete();
    expect(service.photo()?.fileKey).toBe('upload-1');
    expect(service.isUploading()).toBe(false);
  });

  it('rejects oversized files locally and cancels unfinished uploads on reset', () => {
    service.upload(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
    );
    expect(api.upload).not.toHaveBeenCalled();
    service.upload(new File(['photo'], 'photo.png', { type: 'image/png' }));
    service.reset();
    expect(events.observed).toBe(false);
    expect(service.previewUrl()).toBeNull();
    expect(service.isUploading()).toBe(false);
  });
});
