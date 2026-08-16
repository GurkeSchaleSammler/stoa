import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { appLanguageStorageKey, defaultAppLanguage, isAppLanguage } from '../language.constants';
import { AppLanguage } from '../models/app-language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  public readonly currentLanguageKey = signal<AppLanguage>(this.getInitialLanguage());

  constructor() {
    this.setDocumentLanguage(this.currentLanguageKey());

    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.setActiveLanguage(this.normaliseLanguage(event.lang));
      });
  }

  public switchLanguage(languageCode: string): void {
    const language = this.normaliseLanguage(languageCode);
    this.translateService.use(language);
  }

  private getInitialLanguage(): AppLanguage {
    return this.normaliseLanguage(
      this.translateService.getCurrentLang() ??
        localStorage.getItem(appLanguageStorageKey) ??
        defaultAppLanguage,
    );
  }

  private setActiveLanguage(language: AppLanguage): void {
    localStorage.setItem(appLanguageStorageKey, language);
    this.setDocumentLanguage(language);
    this.currentLanguageKey.set(language);
  }

  private setDocumentLanguage(language: AppLanguage): void {
    this.document.documentElement.lang = language;
  }

  private normaliseLanguage(language: string | null | undefined): AppLanguage {
    return isAppLanguage(language) ? language : defaultAppLanguage;
  }
}
