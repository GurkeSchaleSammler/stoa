import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { credentialsInterceptor } from './shared/api/credentials.interceptor';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { appLanguageStorageKey, defaultAppLanguage } from './shared/language.constants';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideTranslateService({
      fallbackLang: defaultAppLanguage,
      lang: localStorage.getItem(appLanguageStorageKey) ?? defaultAppLanguage,
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
        useHttpBackend: true,
      }),
    }),
  ],
};
