import { computed, inject, Injectable, Signal } from '@angular/core';
import { InterpolationParameters, TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language-service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly translateService = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  readonly currentLanguageKey = this.languageService.currentLanguageKey.asReadonly();

  translate(key: string, params?: InterpolationParameters): string {
    this.currentLanguageKey();
    const translation = this.translateService.instant(key, params);
    return typeof translation === 'string' ? translation : key;
  }

  translation(key: string, params?: InterpolationParameters): Signal<string> {
    return computed(() => this.translate(key, params));
  }
}
