import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { PrefsStore } from './domains/profile/data/application/prefs.store';

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('stoa-preferences');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-palette');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('applies palette and brightness as independent document attributes', () => {
    const fixture = TestBed.createComponent(App);
    const prefs = TestBed.inject(PrefsStore);

    prefs.setPalette('yellow');
    prefs.setTheme('dark');
    fixture.detectChanges();

    expect(document.documentElement.dataset['palette']).toBe('yellow');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
