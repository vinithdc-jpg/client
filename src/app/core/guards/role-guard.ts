import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth.service';

export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    const user = inject(AuthService).currentUser();

    if (!user) {
      return router.createUrlTree(['/login']);
    }

    return allowedRoles.includes(user.role)
      ? true
      : router.createUrlTree(['/projects']);
  };
}
