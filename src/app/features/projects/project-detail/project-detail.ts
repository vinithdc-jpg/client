import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import type {
  Bid,
  Project,
} from '../../../../core/services/project.service';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';
import { ProjectWorkspaceComponent } from '../project-workspace/project-workspace';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    ProjectWorkspaceComponent,
    RouterLink,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly authService = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.currentUser;
  project: Project | null = null;
  bids: Bid[] = [];
  projectId = '';
  isLoading = true;
  bidsLoading = false;
  isSaving = false;
  isEditing = false;
  bidSubmitted = false;
  busyBidId = '';
  errorMessage = '';
  successMessage = '';
  title = '';
  description = '';
  budget: number | null = null;
  deadline = '';
  proposedAmount: number | null = null;
  estimatedDays: number | null = null;
  proposal = '';

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const projectId = params.get('projectId');
        if (projectId) {
          this.projectId = projectId;
          this.loadProject(projectId);
        }
      });
  }

  beginEdit(): void {
    if (!this.project) {
      return;
    }

    this.title = this.project.title;
    this.description = this.project.description;
    this.budget = Number(this.project.budget);
    this.deadline = this.project.deadline?.slice(0, 10) ?? '';
    this.isEditing = true;
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.errorMessage = '';
  }

  saveProject(): void {
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

    this.isSaving = true;
    this.errorMessage = '';
    this.projectService
      .updateProject(this.projectId, {
        title: this.title.trim(),
        description: this.description.trim(),
        budget: this.budget,
        deadline: this.deadline || null,
      })
      .subscribe({
        next: (response) => {
          this.project = response.project;
          this.isEditing = false;
          this.isSaving = false;
          this.successMessage = response.message;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Project could not be updated. Please try again.',
          );
          this.isSaving = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  submitBid(): void {
    if (
      this.proposedAmount === null ||
      !Number.isFinite(this.proposedAmount) ||
      this.proposedAmount <= 0 ||
      this.estimatedDays === null ||
      !Number.isSafeInteger(this.estimatedDays) ||
      this.estimatedDays <= 0 ||
      !this.proposal.trim()
    ) {
      this.errorMessage = 'Enter a positive amount, duration, and proposal.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.projectService
      .submitBid(this.projectId, {
        proposed_amount: this.proposedAmount,
        estimated_days: this.estimatedDays,
        proposal: this.proposal.trim(),
      })
      .subscribe({
        next: (response) => {
          this.bidSubmitted = true;
          this.isSaving = false;
          this.successMessage = response.message;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Proposal could not be submitted. Please try again.',
          );
          this.isSaving = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  decideBid(bid: Bid, decision: 'accept' | 'reject'): void {
    this.busyBidId = bid.id;
    this.errorMessage = '';
    this.projectService.decideBid(bid.id, decision).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.busyBidId = '';
        this.changeDetector.markForCheck();
        this.loadProject(this.projectId);
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(
          error,
          'The proposal could not be updated. Please try again.',
        );
        this.busyBidId = '';
        this.changeDetector.markForCheck();
      },
    });
  }

  changeProjectStatus(status: 'completed' | 'cancelled'): void {
    if (
      status === 'cancelled' &&
      !globalThis.confirm('Cancel this project? Pending proposals will be rejected.')
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.projectService
      .updateProjectStatus(this.projectId, status)
      .subscribe({
        next: (response) => {
          this.project = response.project;
          this.successMessage = response.message;
          this.isSaving = false;
          this.loadBids();
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Project status could not be updated. Please try again.',
          );
          this.isSaving = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  private loadProject(projectId: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.getProject(projectId).subscribe({
      next: (response) => {
        this.project = response.project;
        this.isLoading = false;
        this.changeDetector.markForCheck();
        if (this.user()?.role === 'client') {
          this.loadBids();
        }
      },
      error: (error: unknown) => {
        this.project = null;
        this.errorMessage = apiErrorMessage(
          error,
          'Project could not be loaded. Please try again.',
        );
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadBids(): void {
    this.bidsLoading = true;
    this.projectService.listProjectBids(this.projectId).subscribe({
      next: (response) => {
        this.bids = response.bids;
        this.bidsLoading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(
          error,
          'Proposals could not be loaded. Please try again.',
        );
        this.bidsLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  get canEdit(): boolean {
    return (
      this.user()?.role === 'client' &&
      (this.project?.status === 'open' ||
        this.project?.status === 'in_progress')
    );
  }

  get canCancel(): boolean {
    return (
      this.user()?.role === 'client' &&
      (this.project?.status === 'open' ||
        this.project?.status === 'in_progress')
    );
  }

  get canComplete(): boolean {
    return (
      this.user()?.role === 'client' &&
      this.project?.status === 'in_progress'
    );
  }

  get statusLabel(): string {
    return this.project?.status.replace('_', ' ') ?? '';
  }

  get canShowWorkspace(): boolean {
    if (!this.project) {
      return false;
    }
    return (
      (this.user()?.role === 'client' &&
        (this.project.status === 'open' ||
          this.project.status === 'in_progress')) ||
      (this.user()?.role === 'freelancer' &&
        this.project.status === 'in_progress')
    );
  }

  get acceptedFreelancerId(): string | null {
    return this.bids.find((bid) => bid.status === 'accepted')?.freelancer_id ?? null;
  }

  get acceptedFreelancerName(): string {
    return (
      this.bids.find((bid) => bid.status === 'accepted')?.freelancer_name ?? ''
    );
  }
}
