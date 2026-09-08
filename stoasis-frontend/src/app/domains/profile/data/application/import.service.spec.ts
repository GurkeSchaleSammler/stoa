import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProfileApi } from '../api/profile.api';
import { ImportResult } from '../models/import-result';
import { ImportService } from './import.service';

describe('ImportService', () => {
  const report: ImportResult = {
    ready: 1,
    imported: 0,
    skipped: 0,
    duplicates: 0,
    failed: 0,
    errors: [],
    rows: [],
  };
  const api = { importPocket: vi.fn() };
  let service: ImportService;
  const file = new File(['title,url\nExample,https://example.com'], 'bookmarks.csv', {
    type: 'text/csv',
  });

  beforeEach(() => {
    api.importPocket.mockReset().mockReturnValue(of(report));
    TestBed.configureTestingModule({
      providers: [ImportService, { provide: ProfileApi, useValue: api }],
    });
    service = TestBed.inject(ImportService);
  });

  it('previews without importing and confirms only the selected file and board', async () => {
    await service.previewFile(file, 'board-one');
    expect(api.importPocket).toHaveBeenCalledExactlyOnceWith(file, 'board-one', true);
    expect(service.preview()).toEqual(report);
    expect(service.result()).toBeNull();
    api.importPocket.mockReturnValue(of({ ...report, ready: 0, imported: 1 }));
    await service.confirm();
    expect(api.importPocket).toHaveBeenLastCalledWith(file, 'board-one', false);
    expect(service.result()?.imported).toBe(1);
    expect(service.preview()).toBeNull();
  });

  it('prevents confirmation after cancelling or after a rejected preview', async () => {
    await service.previewFile(file, 'board-one');
    service.reset();
    await service.confirm();
    expect(api.importPocket).toHaveBeenCalledTimes(1);
    api.importPocket.mockReturnValue(throwError(() => ({ error: { message: 'Too many rows' } })));
    await service.previewFile(file, 'board-two');
    await service.confirm();
    expect(api.importPocket).toHaveBeenCalledTimes(2);
    expect(service.error()).toBe('Too many rows');
    expect(service.isImporting()).toBe(false);
  });
});
