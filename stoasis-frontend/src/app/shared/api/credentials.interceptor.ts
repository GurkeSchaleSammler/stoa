import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from './api-url';

export const credentialsInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_URL)) {
    return next(request);
  }

  return next(request.clone({ withCredentials: true }));
};
