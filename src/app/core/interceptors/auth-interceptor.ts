import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = environment.apiUrl.replace(/\/$/, '');
  const isApiRequest = req.url.startsWith(`${apiBaseUrl}/`);

  if (!isApiRequest) {
    return next(req);
  }

  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authenticatedRequest);
};
