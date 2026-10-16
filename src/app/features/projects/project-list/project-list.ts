import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import type {
  Project,
  ProjectStatus,
} from '../../../../core/services/project.service';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css',
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly authService = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly user = this.authService.currentUser;
  projects: Project[] = [];
  search = '';
  status: ProjectStatus | '' = '';
  errorMessage = '';
  isLoading = false;
  limit = 12;
  offset = 0;
  total = 0;

  ngOnInit(): void {
    this.loadProjects();
  }

  applyFilters(): void {
    this.offset = 0;
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService
      .listProjects({
        search: this.search.trim() || undefined,
        status: this.status || undefined,
        sort_by: 'created_at',
        direction: 'desc',
        limit: this.limit,
        offset: this.offset,
      })
      .subscribe({
        next: (response) => {
          this.projects = response.projects;
          this.total = response.pagination.total;
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Projects could not be loaded. Please try again.',
          );
          this.isLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  previousPage(): void {
    this.offset = Math.max(0, this.offset - this.limit);
    this.loadProjects();
  }

  nextPage(): void {
    if (this.offset + this.limit < this.total) {
      this.offset += this.limit;
      this.loadProjects();
    }
  }

  get pageNumber(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }
}
