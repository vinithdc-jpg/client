import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ProjectService,
} from '../../../../core/services/project.service';
import type {
  Milestone,
  ProjectActivity,
  ProjectStatus,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
} from '../../../../core/services/project.service';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';
import { DatePickerComponent } from '../../../shared/date-picker/date-picker';

type WorkspaceRole = 'client' | 'freelancer';

const taskStatuses: TaskStatus[] = [
  'todo',
  'in_progress',
  'review',
  'completed',
];
const taskPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

@Component({
  selector: 'app-project-workspace',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DatePickerComponent, FormsModule],
  templateUrl: './project-workspace.html',
})
export class ProjectWorkspaceComponent implements OnChanges {
  private readonly projectService = inject(ProjectService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) projectId = '';
  @Input({ required: true }) projectStatus: ProjectStatus = 'open';
  @Input({ required: true }) role: WorkspaceRole = 'freelancer';
  @Input({ required: true }) currentUserId = '';
  @Input() assignedFreelancerId: string | null = null;
  @Input() assignedFreelancerName = '';

  readonly statuses = taskStatuses;
  readonly priorities = taskPriorities;
  milestones: Milestone[] = [];
  tasks: Task[] = [];
  activity: ProjectActivity[] = [];
  progress = { total: 0, completed: 0, percentage: 0 };
  commentsByTask: Record<string, TaskComment[]> = {};
  commentDrafts: Record<string, string> = {};
  submissionDrafts: Record<string, string> = {};
  reviewFeedback: Record<string, string> = {};
  isLoadingMilestones = false;
  isLoadingTasks = false;
  isLoadingActivity = false;
  isSaving = false;
  isCreatingTask = false;
  isCreatingMilestone = false;
  isMilestoneDropdownOpen = false;
  isAssigneeDropdownOpen = false;
  errorMessage = '';
  successMessage = '';
  activeTaskCommentsId = '';
  loadingCommentsTaskId = '';
  commentBusyId = '';
  editingCommentId = '';
  editedCommentContent = '';
  draggedTaskId = '';
  editingMilestoneId = '';
  editingTaskId = '';

  milestoneTitle = '';
  milestoneDescription = '';
  milestoneAmount: number | null = null;
  milestoneDueDate = '';
  editMilestoneTitle = '';
  editMilestoneDescription = '';
  editMilestoneAmount: number | null = null;
  editMilestoneDueDate = '';

  taskTitle = '';
  taskDescription = '';
  taskPriority: TaskPriority = 'medium';
  taskDueDate = '';
  taskMilestoneId = '';
  taskAssigneeId = '';
  editTaskTitle = '';
  editTaskDescription = '';
  editTaskPriority: TaskPriority = 'medium';
  editTaskDueDate = '';
  editTaskMilestoneId = '';
  editTaskAssigneeId = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.loadWorkspace();
    }
    if (changes['assignedFreelancerId']) {
      this.taskAssigneeId = this.assignedFreelancerId ?? '';
    }
  }

  get canManage(): boolean {
    return (
      this.role === 'client' &&
      (this.projectStatus === 'open' || this.projectStatus === 'in_progress')
    );
  }

  get isActiveProject(): boolean {
    return this.projectStatus === 'in_progress';
  }

  get milestoneProgressLabel(): string {
    return `${this.progress.completed} of ${this.progress.total} milestones approved`;
  }

  loadWorkspace(): void {
    this.loadMilestones();
    this.loadTasks();
    this.loadActivity();
  }

  createMilestone(): void {
    if (!this.milestoneTitle.trim() || this.milestoneAmount === null) {
      this.errorMessage = 'Enter a milestone title and non-negative amount.';
      return;
    }
    if (!Number.isFinite(this.milestoneAmount) || this.milestoneAmount < 0) {
      this.errorMessage = 'Milestone amount must be non-negative.';
      return;
    }

    this.isCreatingMilestone = true;
    this.errorMessage = '';
    this.projectService
      .createMilestone(this.projectId, {
        title: this.milestoneTitle.trim(),
        description: this.milestoneDescription.trim() || null,
        amount: this.milestoneAmount,
        due_date: this.milestoneDueDate || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.milestoneTitle = '';
          this.milestoneDescription = '';
          this.milestoneAmount = null;
          this.milestoneDueDate = '';
          this.isCreatingMilestone = false;
          this.changeDetector.markForCheck();
          this.loadMilestones();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Milestone could not be created. Please try again.',
          );
          this.isCreatingMilestone = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  beginMilestoneEdit(milestone: Milestone): void {
    this.editingMilestoneId = milestone.id;
    this.editMilestoneTitle = milestone.title;
    this.editMilestoneDescription = milestone.description ?? '';
    this.editMilestoneAmount = Number(milestone.amount);
    this.editMilestoneDueDate = milestone.due_date?.slice(0, 10) ?? '';
  }

  cancelMilestoneEdit(): void {
    this.editingMilestoneId = '';
  }

  saveMilestone(milestone: Milestone): void {
    if (
      !this.editMilestoneTitle.trim() ||
      this.editMilestoneAmount === null ||
      !Number.isFinite(this.editMilestoneAmount) ||
      this.editMilestoneAmount < 0
    ) {
      this.errorMessage = 'Enter a milestone title and non-negative amount.';
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.projectService
      .updateMilestone(milestone.id, {
        title: this.editMilestoneTitle.trim(),
        description: this.editMilestoneDescription.trim() || null,
        amount: this.editMilestoneAmount,
        due_date: this.editMilestoneDueDate || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isSaving = false;
          this.editingMilestoneId = '';
          this.changeDetector.markForCheck();
          this.loadMilestones();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Milestone could not be updated. Please try again.',
          );
          this.isSaving = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  moveMilestone(index: number, offset: -1 | 1): void {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= this.milestones.length || this.isSaving) {
      return;
    }
    const reordered = [...this.milestones];
    [reordered[index], reordered[nextIndex]] = [
      reordered[nextIndex]!,
      reordered[index]!,
    ];
    this.isSaving = true;
    this.errorMessage = '';
    this.projectService
      .reorderMilestones(
        this.projectId,
        reordered.map((milestone) => milestone.id),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isSaving = false;
          this.changeDetector.markForCheck();
          this.loadMilestones();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Milestone order could not be saved.',
          );
          this.isSaving = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  startMilestone(milestone: Milestone): void {
    this.updateMilestoneStatus(
      this.projectService.startMilestone(milestone.id),
      'Milestone could not be started. Please try again.',
    );
  }

  submitMilestone(milestone: Milestone): void {
    const submission = this.submissionDrafts[milestone.id]?.trim();
    if (!submission) {
      this.errorMessage = 'Add a submission note before sending it for review.';
      return;
    }
    this.updateMilestoneStatus(
      this.projectService.submitMilestone(milestone.id, submission),
      'Milestone could not be submitted. Please try again.',
    );
  }

  reviewMilestone(
    milestone: Milestone,
    decision: 'approve' | 'request_changes',
  ): void {
    const feedback = this.reviewFeedback[milestone.id]?.trim();
    this.updateMilestoneStatus(
      this.projectService.reviewMilestone(
        milestone.id,
        decision,
        feedback || undefined,
      ),
      'Milestone could not be reviewed. Please try again.',
    );
  }

  createTask(): void {
    if (!this.taskTitle.trim()) {
      this.errorMessage = 'Enter a task title.';
      return;
    }
    this.isCreatingTask = true;
    this.errorMessage = '';
    this.projectService
      .createTask(this.projectId, {
        title: this.taskTitle.trim(),
        description: this.taskDescription.trim() || null,
        priority: this.taskPriority,
        due_date: this.taskDueDate || null,
        milestone_id: this.taskMilestoneId || null,
        assignee_id: this.taskAssigneeId || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.taskTitle = '';
          this.taskDescription = '';
          this.taskPriority = 'medium';
          this.taskDueDate = '';
          this.taskMilestoneId = '';
          this.isCreatingTask = false;
          this.changeDetector.markForCheck();
          this.loadTasks();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Task could not be created. Please try again.',
          );
          this.isCreatingTask = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  tasksIn(status: TaskStatus): Task[] {
    return this.tasks
      .filter((task) => task.status === status)
      .sort((left, right) => left.position - right.position);
  }

  taskStatusLabel(status: TaskStatus): string {
    return status.replace('_', ' ');
  }

  taskTransitionLabel(task: Task, target: TaskStatus): string {
    if (target === 'in_progress' && task.status === 'review') {
      return 'Request changes';
    }
    if (target === 'in_progress') {
      return 'Start';
    }
    if (target === 'review') {
      return 'Submit for review';
    }
    if (target === 'completed') {
      return 'Approve';
    }
    return 'Reopen';
  }

  taskMoveOptions(task: Task): TaskStatus[] {
    if (this.role === 'freelancer') {
      if (task.assignee_id !== this.currentUserId) {
        return [];
      }
      if (task.status === 'todo') {
        return ['in_progress'];
      }
      if (task.status === 'in_progress') {
        return ['review'];
      }
      return [];
    }
    if (task.status === 'review') {
      return ['completed', 'in_progress'];
    }
    if (task.status === 'completed') {
      return ['todo'];
    }
    return [];
  }

  canDragTask(task: Task): boolean {
    return (
      this.role === 'client' ||
      (this.role === 'freelancer' && task.assignee_id === this.currentUserId)
    );
  }

  startTaskDrag(event: DragEvent, task: Task): void {
    if (!this.canDragTask(task)) {
      event.preventDefault();
      return;
    }
    this.draggedTaskId = task.id;
    event.dataTransfer?.setData('text/plain', task.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  allowTaskDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropTask(event: DragEvent, status: TaskStatus, position: number): void {
    event.preventDefault();
    event.stopPropagation();
    const taskId = event.dataTransfer?.getData('text/plain') || this.draggedTaskId;
    this.draggedTaskId = '';
    const task = this.tasks.find((candidate) => candidate.id === taskId);
    if (!task || !this.canDragTask(task)) {
      return;
    }
    if (task.status !== status && !this.taskMoveOptions(task).includes(status)) {
      this.errorMessage = 'This task cannot be moved to that status.';
      return;
    }
    this.moveTask(task, status, position);
  }

  moveTask(task: Task, status: TaskStatus, position: number): void {
    if (status !== task.status && !this.taskMoveOptions(task).includes(status)) {
      this.errorMessage = 'This task cannot be moved to that status.';
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.projectService
      .moveTask(task.id, status, position)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isSaving = false;
          this.changeDetector.markForCheck();
          this.loadTasks();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Task could not be moved. Please try again.',
          );
          this.isSaving = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  beginTaskEdit(task: Task): void {
    this.editingTaskId = task.id;
    this.editTaskTitle = task.title;
    this.editTaskDescription = task.description ?? '';
    this.editTaskPriority = task.priority;
    this.editTaskDueDate = task.due_date?.slice(0, 10) ?? '';
    this.editTaskMilestoneId = task.milestone_id ?? '';
    this.editTaskAssigneeId = task.assignee_id ?? '';
  }

  cancelTaskEdit(): void {
    this.editingTaskId = '';
  }

  saveTask(task: Task): void {
    if (!this.editTaskTitle.trim()) {
      this.errorMessage = 'Enter a task title.';
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.projectService
      .updateTask(task.id, {
        title: this.editTaskTitle.trim(),
        description: this.editTaskDescription.trim() || null,
        priority: this.editTaskPriority,
        due_date: this.editTaskDueDate || null,
        milestone_id: this.editTaskMilestoneId || null,
        assignee_id: this.editTaskAssigneeId || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isSaving = false;
          this.editingTaskId = '';
          this.changeDetector.markForCheck();
          this.loadTasks();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Task could not be updated. Please try again.',
          );
          this.isSaving = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  toggleComments(task: Task): void {
    if (this.activeTaskCommentsId === task.id) {
      this.activeTaskCommentsId = '';
      return;
    }
    this.activeTaskCommentsId = task.id;
    if (!this.commentsByTask[task.id]) {
      this.loadComments(task.id);
    }
  }

  addComment(task: Task): void {
    const content = this.commentDrafts[task.id]?.trim();
    if (!content) {
      this.errorMessage = 'Enter a comment before posting.';
      return;
    }
    this.commentBusyId = task.id;
    this.errorMessage = '';
    this.projectService
      .createTaskComment(task.id, content)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.commentDrafts[task.id] = '';
          this.commentBusyId = '';
          this.changeDetector.markForCheck();
          this.loadComments(task.id);
          this.loadTasks();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Comment could not be posted. Please try again.',
          );
          this.commentBusyId = '';
          this.changeDetector.markForCheck();
        },
      });
  }

  beginCommentEdit(comment: TaskComment): void {
    this.editingCommentId = comment.id;
    this.editedCommentContent = comment.content;
  }

  cancelCommentEdit(): void {
    this.editingCommentId = '';
  }

  saveComment(comment: TaskComment): void {
    const content = this.editedCommentContent.trim();
    if (!content) {
      this.errorMessage = 'Comment content cannot be empty.';
      return;
    }
    this.commentBusyId = comment.id;
    this.errorMessage = '';
    this.projectService
      .updateTaskComment(comment.id, content)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.commentBusyId = '';
          this.editingCommentId = '';
          this.changeDetector.markForCheck();
          this.loadComments(comment.task_id);
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Comment could not be updated. Please try again.',
          );
          this.commentBusyId = '';
          this.changeDetector.markForCheck();
        },
      });
  }

  deleteComment(comment: TaskComment): void {
    this.commentBusyId = comment.id;
    this.errorMessage = '';
    this.projectService
      .deleteTaskComment(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.commentBusyId = '';
          this.changeDetector.markForCheck();
          this.loadComments(comment.task_id);
          this.loadTasks();
          this.loadActivity();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Comment could not be deleted. Please try again.',
          );
          this.commentBusyId = '';
          this.changeDetector.markForCheck();
        },
      });
  }

  canEditComment(comment: TaskComment): boolean {
    return comment.author_id === this.currentUserId;
  }

  canDeleteComment(comment: TaskComment): boolean {
    return this.canEditComment(comment) || this.role === 'client';
  }

  humanizeAction(action: string): string {
    return action.replaceAll('_', ' ');
  }

  private updateMilestoneStatus(
    request: ReturnType<ProjectService['startMilestone']>,
    fallback: string,
  ): void {
    this.isSaving = true;
    this.errorMessage = '';
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isSaving = false;
        this.changeDetector.markForCheck();
        this.loadMilestones();
        this.loadActivity();
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, fallback);
        this.isSaving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadMilestones(): void {
    this.isLoadingMilestones = true;
    this.projectService
      .listProjectMilestones(this.projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.milestones = response.milestones;
          this.progress = response.progress;
          this.isLoadingMilestones = false;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Milestones could not be loaded. Please try again.',
          );
          this.isLoadingMilestones = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  private loadTasks(): void {
    this.isLoadingTasks = true;
    this.projectService
      .listProjectTasks(this.projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.tasks = response.tasks;
          this.isLoadingTasks = false;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Tasks could not be loaded. Please try again.',
          );
          this.isLoadingTasks = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  private loadComments(taskId: string): void {
    this.loadingCommentsTaskId = taskId;
    this.projectService
      .listTaskComments(taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.commentsByTask[taskId] = response.comments;
          this.loadingCommentsTaskId = '';
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Comments could not be loaded. Please try again.',
          );
          this.loadingCommentsTaskId = '';
          this.changeDetector.markForCheck();
        },
      });
  }

  private loadActivity(): void {
    this.isLoadingActivity = true;
    this.projectService
      .listProjectActivity(this.projectId, 20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.activity = response.activity;
          this.isLoadingActivity = false;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'Project activity could not be loaded. Please try again.',
          );
          this.isLoadingActivity = false;
          this.changeDetector.markForCheck();
        },
      });
  }
}
