import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { credentialsInterceptor } from './shared/api/credentials.interceptor';
import { provideTranslateService } from '@ngx-translate/core';
import { appLanguageStorageKey, defaultAppLanguage } from './shared/language.constants';
import { provideTranslateMultiHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideTranslateService({
      fallbackLang: defaultAppLanguage,
      lang: localStorage.getItem(appLanguageStorageKey) ?? defaultAppLanguage,
      loader: provideTranslateMultiHttpLoader({
        resources: [
          { prefix: './i18n/core/', suffix: '.json' },
          { prefix: './i18n/workspace/', suffix: '.json' },
        ],
        useHttpBackend: true,
      }),
    }),
  ],
};
