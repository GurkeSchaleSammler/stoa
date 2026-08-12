import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { LanguageService } from './language-service';
import { appLanguageStorageKey } from '../language.constants';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    localStorage.removeItem(appLanguageStorageKey);
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    });
    service = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updates its signal, storage and the document language', () => {
    service.switchLanguage('fr');

    expect(service.currentLanguageKey()).toBe('fr');
    expect(localStorage.getItem(appLanguageStorageKey)).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('falls back to German for unsupported languages', () => {
    service.switchLanguage('es');

    expect(service.currentLanguageKey()).toBe('de');
  });
});
