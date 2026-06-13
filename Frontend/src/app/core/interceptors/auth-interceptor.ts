import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Prepend base URL for all relative /api/ calls
  const apiReq = req.url.startsWith('/api/')
    ? req.clone({
        url: `${environment.apiBaseUrl}${req.url}`,
        withCredentials: true,
      })
    : req;
  return next(apiReq);
};
