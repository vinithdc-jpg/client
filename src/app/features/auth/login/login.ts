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
          this.successMessage = response.message;
          this.isLoading = false;

          // Token storage and navigation will be added
          // in a later step.
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to log in. Please try again.';
          this.isLoading = false;
        },
      });
  }
}
