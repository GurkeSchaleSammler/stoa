import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { SessionContextStore } from '../../../shared/application/session-context.store';
import { ConfirmationDialogService } from '../../../shared/application/confirmation-dialog.service';
import { Pin } from '../../../shared/models/pin';
import { BoardClipboardService } from '../data/application/board-clipboard.service';
import { PinService } from '../data/application/pin.service';
import { PinDetailHandlerComponent } from './pin-detail-handler';

describe('PinDetailHandlerComponent', () => {
  const updatePin = vi.fn();
  const pins = {
    canEdit: signal(true),
    context: signal({ id: 'collection-1', currentUserRole: 'owner', isSystem: false }),
    isMutating: signal(false),
    updatePin,
    deletePin: vi.fn(),
    addComment: vi.fn(),
    pastePin: vi.fn(),
  };

  const note: Pin = {
    id: 'pin-1',
    collectionId: 'collection-1',
    createdBy: 'user-1',
    createdByName: 'Ada',
    createdByAvatarUrl: null,
    sortOrder: 1,
    tags: [],
    comments: [],
    createdAt: '2026-10-06T12:00:00Z',
    grid: { id: 'grid-1', x: 0, y: 0, width: 16, heightClips: 16, layer: 1, contentType: 'note' },
    type: 'note',
    data: { title: 'Starter title', content: 'Starter prompt', color: 'white' },
  };

  beforeEach(async () => {
    updatePin.mockClear();
    await TestBed.configureTestingModule({
      imports: [PinDetailHandlerComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'de', lang: 'de' }),
        { provide: PinService, useValue: pins },
        { provide: BoardClipboardService, useValue: { copy: vi.fn() } },
        { provide: ConfirmationDialogService, useValue: { confirm: vi.fn() } },
        { provide: SessionContextStore, useValue: { user: signal({ plan: 'free' }) } },
      ],
    }).compileComponents();
  });

  it('loads and saves editable note titles', async () => {
    const fixture = TestBed.createComponent(PinDetailHandlerComponent);
    fixture.componentRef.setInput('collectionId', 'collection-1');
    fixture.componentRef.setInput('pin', note);
    fixture.componentInstance.editMode.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.editValue().title).toBe('Starter title');
    expect(
      (fixture.nativeElement.querySelector('.dialog-field input') as HTMLInputElement).value,
    ).toBe('Starter title');
    fixture.componentInstance.changeDraft({ title: 'Renamed section' });
    fixture.componentInstance.save();

    expect(updatePin).toHaveBeenCalledWith(
      'collection-1',
      'pin-1',
      expect.objectContaining({
        data: { title: 'Renamed section', content: 'Starter prompt', color: 'white' },
      }),
      expect.any(Function),
    );
  });
});
