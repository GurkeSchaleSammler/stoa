import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { InviteInfo } from '../data/models/invite-info';
import { InviteDialogComponent } from './invite-dialog';

describe('InviteDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteDialogComponent],
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();
  });

  it('does not offer an invitation link for a public collection', () => {
    const fixture = TestBed.createComponent(InviteDialogComponent);
    const invite: InviteInfo = {
      collectionId: 'collection-1',
      token: '',
      url: '/shared/collections/collection-1',
      visibility: 'public',
      collectionName: 'Public board',
      capacity: {
        memberLimit: 5,
        sharedBoardLimit: 5,
        ownedSharedBoards: 1,
        limitReason: null,
      },
    };

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('invite', invite);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.public-state')).not.toBeNull();
    expect(element.textContent).toContain('membership.publicCollection');
    expect(element.textContent).not.toContain('membership.privateCollection');
    expect(element.textContent).not.toContain('membership.createInviteLink');
  });
});
