import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PhotoPinComponent } from './photo-pin';

describe('PhotoPinComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [PhotoPinComponent],
      providers: [provideTranslateService({ lang: 'de' })],
    }),
  );

  it('replaces a failed photo with a placeholder and loads a replacement URL', () => {
    const fixture = TestBed.createComponent(PhotoPinComponent);
    fixture.componentRef.setInput('data', { imageUrl: '/missing.jpg', caption: 'Workshop' });
    fixture.componentRef.setInput('meta', { createdByName: 'Jo', createdAt: '2026-10-08' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.image-fullview-trigger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.photo-placeholder')).not.toBeNull();

    fixture.componentRef.setInput('data', { imageUrl: '/replacement.jpg', caption: 'Workshop' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('/replacement.jpg');
    expect(fixture.nativeElement.querySelector('.image-fullview-trigger')).not.toBeNull();
  });
});
