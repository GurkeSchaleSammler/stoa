import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Pin } from '../../shared/models/pin';
import { PinDetailComponent } from './ui/pin-detail';
import { PublicBoardPresentationComponent } from './public-api';

describe('board public presentation API', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicBoardPresentationComponent],
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();
  });

  it('opens pin details without edit or comment controls', () => {
    const fixture = TestBed.createComponent(PublicBoardPresentationComponent);
    const pin: Pin = {
      id: 'pin-1',
      collectionId: 'collection-1',
      createdBy: 'user-1',
      createdByName: 'Ada',
      createdByAvatarUrl: null,
      sortOrder: 0,
      tags: [],
      comments: [],
      createdAt: '2026-10-05T12:00:00Z',
      grid: {
        id: 'grid-1',
        x: 0,
        y: 0,
        width: 16,
        heightClips: 1,
        layer: 0,
        contentType: 'note',
      },
      type: 'note',
      data: { title: 'Public note', content: 'Read only', color: '#ffffff' },
    };

    fixture.componentRef.setInput('pins', [pin]);
    fixture.componentInstance.selectPin(pin.id);
    fixture.detectChanges();

    const detail = fixture.debugElement.query(By.directive(PinDetailComponent))
      .componentInstance as PinDetailComponent;
    expect(detail.pin()).toEqual(pin);
    expect(detail.canEdit()).toBe(false);
    expect(detail.canComment()).toBe(false);
    expect(fixture.nativeElement.querySelector('.comment-form')).toBeNull();
  });
});
