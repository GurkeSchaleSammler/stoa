import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { WorkspaceShellComponent } from './workspace-shell';
import { ViewportService } from '../shared/application/viewport.service';
import { FeatureFlagsService } from '../shared/application/feature-flags.service';
import { SessionContextStore } from '../shared/application/session-context.store';
import { LanguageService } from '../shared/application/language-service';
import { AuthService } from '../domains/auth/data/application/auth-service';

@Component({ template: '' })
class ProfileStub {}

describe('Mobile account navigation', () => {
  it('closes the sheet when choosing the current profile route', async () => {
    TestBed.configureTestingModule({
      imports: [WorkspaceShellComponent],
      providers: [
        provideRouter([{ path: 'profile', component: ProfileStub }]),
        provideTranslateService({ lang: 'de' }),
        { provide: ViewportService, useValue: { compact: signal(true) } },
        { provide: FeatureFlagsService, useValue: { load: vi.fn(), skillsEnabled: signal(false) } },
        { provide: SessionContextStore, useValue: { user: signal(null) } },
        { provide: LanguageService, useValue: { currentLanguageKey: signal('de') } },
        { provide: AuthService, useValue: { logout: vi.fn() } },
      ],
    });
    await TestBed.inject(Router).navigateByUrl('/profile');
    const fixture = TestBed.createComponent(WorkspaceShellComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.mobile-header-actions button').click();
    fixture.detectChanges();
    const profile: HTMLAnchorElement = fixture.nativeElement.querySelector(
      '.account-sheet-content a',
    );
    expect(profile).not.toBeNull();
    profile.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.account-sheet-content')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/profile');
  });
});
