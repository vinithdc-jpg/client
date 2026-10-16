import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

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
          sessionStorage.setItem('auth_token', response.token);
          sessionStorage.setItem('auth_user', JSON.stringify(response.user));

          this.successMessage = response.message;
          this.isLoading = false;
        },

        error: (error: unknown) => {
          this.errorMessage = this.getLoginErrorMessage(error);

          this.successMessage = '';
          this.isLoading = false;
        },
      });
  }

  private getLoginErrorMessage(error: unknown): string {
    const responseBody =
      typeof error === 'object' && error !== null && 'error' in error
        ? error.error
        : error;

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
