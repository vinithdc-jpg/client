import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';
import { DatePickerComponent } from '../../../shared/date-picker/date-picker';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [DatePickerComponent, FormsModule, RouterLink],
  templateUrl: './project-create.html',
})
export class ProjectCreateComponent {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  title = '';
  description = '';
  budget: number | null = null;
  deadline = '';
  errorMessage = '';
  isLoading = false;

  onSubmit(): void {
    this.errorMessage = '';
    if (
      !this.title.trim() ||
      !this.description.trim() ||
      this.budget === null ||
      !Number.isFinite(this.budget) ||
      this.budget < 0
    ) {
      this.errorMessage = 'Enter a title, description, and valid non-negative budget.';
      return;
    }

    this.isLoading = true;
    this.projectService
      .createProject({
        title: this.title.trim(),
        description: this.description.trim(),
        budget: this.budget,
        deadline: this.deadline || null,
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.changeDetector.markForCheck();
          void this.router.navigate(['/projects', response.project.id]);
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Project could not be created. Please try again.',
          );
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }
}
