import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import type { Bid } from '../../../../core/services/project.service';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';

@Component({
  selector: 'app-my-bids',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './my-bids.html',
  styleUrl: './my-bids.css',
})
export class MyBidsComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  bids: Bid[] = [];
  limit = 20;
  offset = 0;
  total = 0;
  isLoading = false;
  busyBidId = '';
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadBids();
  }

  loadBids(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.listMyBids(this.limit, this.offset).subscribe({
      next: (response) => {
        this.bids = response.bids;
        this.total = response.pagination.total;
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(
          error,
          'Your proposals could not be loaded. Please try again.',
        );
        this.isLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  withdraw(bid: Bid): void {
    this.busyBidId = bid.id;
    this.errorMessage = '';
    this.projectService.withdrawBid(bid.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.busyBidId = '';
        this.changeDetector.markForCheck();
        this.loadBids();
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(
          error,
          'The proposal could not be withdrawn. Please try again.',
        );
        this.busyBidId = '';
        this.changeDetector.markForCheck();
      },
    });
  }

  previousPage(): void {
    this.offset = Math.max(0, this.offset - this.limit);
    this.loadBids();
  }

  nextPage(): void {
    if (this.offset + this.limit < this.total) {
      this.offset += this.limit;
      this.loadBids();
    }
  }

  get pageNumber(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  isProjectVisible(bid: Bid): boolean {
    return bid.project_status === 'open' || bid.status === 'accepted';
  }
}
