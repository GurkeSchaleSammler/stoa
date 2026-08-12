import { TestBed } from '@angular/core/testing';
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnackbarService);
  });

  it('publishes success and error feedback through a readonly signal', () => {
    service.success('snackbar.pinCreated');
    service.error('errors.board');

    expect(service.messages()).toEqual([
      expect.objectContaining({ message: 'snackbar.pinCreated', tone: 'success' }),
      expect.objectContaining({ message: 'errors.board', tone: 'error' }),
    ]);
  });

  it('dismisses an individual message', () => {
    service.info('common.loading');
    const [message] = service.messages();

    service.dismiss(message.id);

    expect(service.messages()).toEqual([]);
  });
});
