import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ProjectService } from '../../../../core/services/project.service';
import type { Project, ProjectStatus } from '../../../../core/services/project.service';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';

interface ChatContact {
  id: string;
  name: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  sentAt: string;
  fromCurrentUser: boolean;
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './project-list.html',
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
  chatContactId = '';
  messageDraft = '';
  private readonly chatMessages: Record<string, ChatMessage[]> = {};

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
          if (!this.chatContacts.some((contact) => contact.id === this.chatContactId)) {
            this.chatContactId = this.chatContacts[0]?.id ?? '';
          }
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

  setStatusFilter(status: ProjectStatus | ''): void {
    this.status = this.status === status ? '' : status;
    this.offset = 0;
    this.loadProjects();
  }

  openChat(contactId: string): void {
    if (this.chatContacts.some((contact) => contact.id === contactId)) {
      this.chatContactId = contactId;
      this.changeDetector.markForCheck();
    }
  }

  sendMessage(): void {
    const text = this.messageDraft.trim();
    const contact = this.selectedChatContact;
    if (!text || !contact) {
      return;
    }

    this.chatMessages[contact.id] ??= [];
    this.chatMessages[contact.id].push({
      sender: this.user()?.name ?? 'You',
      text,
      sentAt: new Date().toISOString(),
      fromCurrentUser: true,
    });
    this.messageDraft = '';
  }

  get chatContacts(): ChatContact[] {
    const contacts = new Map<string, ChatContact>();
    for (const project of this.projects) {
      if (project.client_id !== this.user()?.id && project.client_name?.trim()) {
        contacts.set(project.client_id, {
          id: project.client_id,
          name: project.client_name,
        });
      }
    }
    return [...contacts.values()];
  }

  get selectedChatContact(): ChatContact | undefined {
    return this.chatContacts.find((contact) => contact.id === this.chatContactId);
  }

  get activeMessages(): ChatMessage[] {
    return this.chatMessages[this.chatContactId] ?? [];
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
