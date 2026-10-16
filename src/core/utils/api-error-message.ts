import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (
    error instanceof HttpErrorResponse &&
    typeof error.error?.message === 'string' &&
    error.error.message.trim()
  ) {
    return error.error.message.trim();
  }

  return fallback;
}
