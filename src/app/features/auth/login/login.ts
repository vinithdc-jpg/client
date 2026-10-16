import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Enter your email and password.';
      return;
    }

    this.isLoading = true;

    this.authService
      .login({
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          this.authService.saveSession(response);
          this.successMessage = response.message;
          this.isLoading = false;
          this.changeDetector.markForCheck();
          void this.router.navigate(['/projects']);
        },

        error: (error: unknown) => {
          this.errorMessage = this.getLoginErrorMessage(error);

          this.successMessage = '';
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  private getLoginErrorMessage(error: unknown): string {
    const responseBody =
      typeof error === 'object' && error !== null && 'error' in error ? error.error : error;

    if (
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'message' in responseBody &&
      typeof responseBody.message === 'string' &&
      responseBody.message.trim()
    ) {
      return responseBody.message.trim();
    }

    return 'Unable to sign in. Please try again.';
  }
}
