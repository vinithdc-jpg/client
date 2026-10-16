import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'paid';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  client_id: string;
  client_name?: string;
  title: string;
  description: string;
  budget: string | number;
  deadline: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  project_id: string;
  freelancer_id: string;
  freelancer_name?: string;
  proposed_amount: string | number;
  estimated_days: number;
  proposal: string;
  status: BidStatus;
  created_at: string;
  updated_at: string;
  project_title?: string;
  project_status?: ProjectStatus;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  amount: string | number;
  due_date: string | null;
  status: MilestoneStatus;
  position: number;
  created_at: string;
  updated_at: string;
  latest_submission?: string | null;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  assignee_id: string | null;
  assignee_name?: string | null;
  milestone_title?: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ProjectPayload {
  title: string;
  description: string;
  budget: number;
  deadline: string | null;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus;
  sort_by?: 'created_at' | 'title' | 'budget' | 'deadline' | 'status';
  direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  listProjects(
    filters: ProjectListParams = {},
  ): Observable<{ projects: Project[]; pagination: Pagination }> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    }

    return this.http.get<{ projects: Project[]; pagination: Pagination }>(
      `${this.apiUrl}/projects`,
      { params },
    );
  }

  getProject(projectId: string): Observable<{ project: Project }> {
    return this.http.get<{ project: Project }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}`,
    );
  }

  listProjectMilestones(
    projectId: string,
  ): Observable<{
    milestones: Milestone[];
    progress: { total: number; completed: number; percentage: number };
  }> {
    return this.http.get<{
      milestones: Milestone[];
      progress: { total: number; completed: number; percentage: number };
    }>(`${this.apiUrl}/projects/${encodeURIComponent(projectId)}/milestones`);
  }

  createMilestone(
    projectId: string,
    milestone: {
      title: string;
      description: string | null;
      amount: number;
      due_date: string | null;
    },
  ): Observable<{ message: string; milestone: Milestone }> {
    return this.http.post<{ message: string; milestone: Milestone }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/milestones`,
      milestone,
    );
  }

  updateMilestone(
    milestoneId: string,
    changes: {
      title: string;
      description: string | null;
      amount: number;
      due_date: string | null;
    },
  ): Observable<{ message: string; milestone: Milestone }> {
    return this.http.patch<{ message: string; milestone: Milestone }>(
      `${this.apiUrl}/milestones/${encodeURIComponent(milestoneId)}`,
      changes,
    );
  }

  reorderMilestones(
    projectId: string,
    milestoneIds: string[],
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/milestones/reorder`,
      { milestone_ids: milestoneIds },
    );
  }

  startMilestone(
    milestoneId: string,
  ): Observable<{ message: string; milestone: Milestone }> {
    return this.http.post<{ message: string; milestone: Milestone }>(
      `${this.apiUrl}/milestones/${encodeURIComponent(milestoneId)}/start`,
      {},
    );
  }

  submitMilestone(
    milestoneId: string,
    submission: string,
  ): Observable<{ message: string; milestone: Milestone }> {
    return this.http.post<{ message: string; milestone: Milestone }>(
      `${this.apiUrl}/milestones/${encodeURIComponent(milestoneId)}/submit`,
      { submission },
    );
  }

  reviewMilestone(
    milestoneId: string,
    decision: 'approve' | 'request_changes',
    feedback?: string,
  ): Observable<{ message: string; milestone: Milestone }> {
    return this.http.patch<{ message: string; milestone: Milestone }>(
      `${this.apiUrl}/milestones/${encodeURIComponent(milestoneId)}/review`,
      { decision, ...(feedback ? { feedback } : {}) },
    );
  }

  listProjectTasks(projectId: string): Observable<{ tasks: Task[] }> {
    return this.http.get<{ tasks: Task[] }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/tasks`,
    );
  }

  createTask(
    projectId: string,
    task: {
      title: string;
      description: string | null;
      priority: TaskPriority;
      due_date: string | null;
      milestone_id: string | null;
      assignee_id: string | null;
    },
  ): Observable<{ message: string; task: Task }> {
    return this.http.post<{ message: string; task: Task }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/tasks`,
      task,
    );
  }

  updateTask(
    taskId: string,
    changes: {
      title: string;
      description: string | null;
      priority: TaskPriority;
      due_date: string | null;
      milestone_id: string | null;
      assignee_id: string | null;
    },
  ): Observable<{ message: string; task: Task }> {
    return this.http.patch<{ message: string; task: Task }>(
      `${this.apiUrl}/tasks/${encodeURIComponent(taskId)}`,
      changes,
    );
  }

  moveTask(
    taskId: string,
    status: TaskStatus,
    position: number,
  ): Observable<{ message: string; task: Task }> {
    return this.http.patch<{ message: string; task: Task }>(
      `${this.apiUrl}/tasks/${encodeURIComponent(taskId)}/move`,
      { status, position },
    );
  }

  listTaskComments(taskId: string): Observable<{ comments: TaskComment[] }> {
    return this.http.get<{ comments: TaskComment[] }>(
      `${this.apiUrl}/tasks/${encodeURIComponent(taskId)}/comments`,
    );
  }

  createTaskComment(
    taskId: string,
    content: string,
  ): Observable<{ message: string; comment: TaskComment }> {
    return this.http.post<{ message: string; comment: TaskComment }>(
      `${this.apiUrl}/tasks/${encodeURIComponent(taskId)}/comments`,
      { content },
    );
  }

  updateTaskComment(
    commentId: string,
    content: string,
  ): Observable<{ message: string; comment: TaskComment }> {
    return this.http.patch<{ message: string; comment: TaskComment }>(
      `${this.apiUrl}/tasks/comments/${encodeURIComponent(commentId)}`,
      { content },
    );
  }

  deleteTaskComment(commentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/tasks/comments/${encodeURIComponent(commentId)}`,
    );
  }

  listProjectActivity(
    projectId: string,
    limit = 50,
  ): Observable<{ activity: ProjectActivity[] }> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<{ activity: ProjectActivity[] }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/activity`,
      { params },
    );
  }

  createProject(
    project: ProjectPayload,
  ): Observable<{ message: string; project: Project }> {
    return this.http.post<{ message: string; project: Project }>(
      `${this.apiUrl}/projects`,
      project,
    );
  }

  updateProject(
    projectId: string,
    changes: Partial<ProjectPayload>,
  ): Observable<{ message: string; project: Project }> {
    return this.http.patch<{ message: string; project: Project }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}`,
      changes,
    );
  }

  updateProjectStatus(
    projectId: string,
    status: 'completed' | 'cancelled',
  ): Observable<{ message: string; project: Project }> {
    return this.http.patch<{ message: string; project: Project }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/status`,
      { status },
    );
  }

  listProjectBids(projectId: string): Observable<{ bids: Bid[] }> {
    return this.http.get<{ bids: Bid[] }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/bids`,
    );
  }

  submitBid(
    projectId: string,
    bid: {
      proposed_amount: number;
      estimated_days: number;
      proposal: string;
    },
  ): Observable<{ message: string; bid: Bid }> {
    return this.http.post<{ message: string; bid: Bid }>(
      `${this.apiUrl}/projects/${encodeURIComponent(projectId)}/bids`,
      bid,
    );
  }

  listMyBids(
    limit = 20,
    offset = 0,
  ): Observable<{ bids: Bid[]; pagination: Pagination }> {
    const params = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);

    return this.http.get<{ bids: Bid[]; pagination: Pagination }>(
      `${this.apiUrl}/bids/mine`,
      { params },
    );
  }

  decideBid(
    bidId: string,
    decision: 'accept' | 'reject',
  ): Observable<{ message: string; bid: Bid }> {
    return this.http.patch<{ message: string; bid: Bid }>(
      `${this.apiUrl}/bids/${encodeURIComponent(bidId)}/decision`,
      { decision },
    );
  }

  withdrawBid(bidId: string): Observable<{ message: string; bid: Bid }> {
    return this.http.post<{ message: string; bid: Bid }>(
      `${this.apiUrl}/bids/${encodeURIComponent(bidId)}/withdraw`,
      {},
    );
  }
}
