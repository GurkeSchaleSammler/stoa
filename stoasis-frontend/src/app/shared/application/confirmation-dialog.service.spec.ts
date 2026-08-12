import { TestBed } from '@angular/core/testing';
import { ConfirmationDialogService } from './confirmation-dialog.service';

describe('ConfirmationDialogService', () => {
  let service: ConfirmationDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmationDialogService);
  });

  it('resolves true only after the app dialog is accepted', async () => {
    const result = service.confirm({ title: 'pin.deleteTitle', message: 'pin.confirmDelete' });

    expect(service.request()).toEqual(
      expect.objectContaining({
        title: 'pin.deleteTitle',
        confirmLabel: 'common.confirm',
        tone: 'default',
      }),
    );

    service.accept();

    await expect(result).resolves.toBe(true);
    expect(service.request()).toBeNull();
  });

  it('resolves false when the dialog is cancelled', async () => {
    const result = service.confirm({
      title: 'collection.deleteTitle',
      message: 'collection.confirmDelete',
    });

    service.cancel();

    await expect(result).resolves.toBe(false);
  });
});
