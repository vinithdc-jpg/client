import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import type { UserRole } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  name = '';
  email = '';
  password = '';
  role: UserRole = 'freelancer';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    if (this.password.length < 8 || this.password.length > 72) {
      this.errorMessage = 'Password must be between 8 and 72 characters.';
      return;
    }

    this.isLoading = true;

    this.authService
      .register({
        name: this.name.trim(),
        email: this.email.trim().toLowerCase(),
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.password = '';
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Registration failed. Please try again.';
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }
}
