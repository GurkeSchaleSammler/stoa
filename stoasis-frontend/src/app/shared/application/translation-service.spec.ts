import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TranslationService } from './translation-service';
import { LanguageService } from './language-service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    });
    service = TestBed.inject(TranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updates computed translations when the language signal changes', () => {
    const translate = TestBed.inject(TranslateService);
    const language = TestBed.inject(LanguageService);
    translate.setTranslation('de', { greeting: 'Hallo' });
    translate.setTranslation('en', { greeting: 'Hello' });
    const greeting = service.translation('greeting');

    expect(greeting()).toBe('Hallo');
    language.switchLanguage('en');
    expect(greeting()).toBe('Hello');
  });
});
