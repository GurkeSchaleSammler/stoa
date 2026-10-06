import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { OnboardingService } from './onboarding.service';
import { SessionContextStore } from './session-context.store';
import { SnackbarService } from './snackbar.service';

describe('OnboardingService', () => {
  const userId = signal<string | null>('user-a');
  const error = vi.fn();
  let service: OnboardingService;
  let http: HttpTestingController;
  beforeEach(() => {
    userId.set('user-a');
    error.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionContextStore, useValue: { userId } },
        { provide: SnackbarService, useValue: { error } },
      ],
    });
    service = TestBed.inject(OnboardingService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });
  afterEach(() => http.verify());

  it('marks skipped tutorials as seen only after a successful save', () => {
    http.expectOne((request) => request.url.endsWith('/me/flags')).flush([]);
    const closed = vi.fn();
    const key = 'tutorial.board-templates.v1';
    service.acknowledge(key, 'skipped', closed);
    expect(service.hasSeen(key)).toBe(false);
    const save = http.expectOne((request) => request.url.endsWith(`/me/flags/${key}`));
    expect(save.request.body).toEqual({ outcome: 'skipped' });
    save.flush(null);
    expect(service.hasSeen(key)).toBe(true);
    expect(closed).toHaveBeenCalledOnce();
  });

  it('retains the tour and reports errors when saving fails', () => {
    http.expectOne((request) => request.url.endsWith('/me/flags')).flush([]);
    const closed = vi.fn();
    service.acknowledge('tutorial.test.v1', 'completed', closed);
    http
      .expectOne((request) => request.method === 'PUT')
      .flush({}, { status: 500, statusText: 'Error' });
    expect(closed).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('onboarding.saveError');
    expect(service.isSaving()).toBe(false);
    expect(service.hasSeen('tutorial.test.v1')).toBe(false);
  });

  it('clears flags and cancels obsolete loads when the account changes', () => {
    const old = http.expectOne((request) => request.url.endsWith('/me/flags'));
    userId.set('user-b');
    TestBed.tick();
    expect(old.cancelled).toBe(true);
    expect(service.ready()).toBe(false);
    http
      .expectOne((request) => request.url.endsWith('/me/flags'))
      .flush([{ key: 'tutorial.test.v1', outcome: 'completed', seenAt: '2026-10-05T00:00:00Z' }]);
    expect(service.hasSeen('tutorial.test.v1')).toBe(true);
    userId.set(null);
    TestBed.tick();
    expect(service.ready()).toBe(false);
    expect(service.hasSeen('tutorial.test.v1')).toBe(false);
  });
});
