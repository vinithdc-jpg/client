import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProjectService } from '../../../../core/services/project.service';
import { ProjectWorkspaceComponent } from './project-workspace';

describe('ProjectWorkspaceComponent', () => {
  let fixture: ComponentFixture<ProjectWorkspaceComponent>;
  let service: {
    listProjectMilestones: ReturnType<typeof vi.fn>;
    listProjectTasks: ReturnType<typeof vi.fn>;
    listProjectActivity: ReturnType<typeof vi.fn>;
    createMilestone: ReturnType<typeof vi.fn>;
    moveTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      listProjectMilestones: vi.fn(() =>
        of({
          milestones: [
            {
              id: '12',
              project_id: '5',
              title: 'Design review',
              description: null,
              amount: '300',
              due_date: null,
              status: 'pending',
              position: 0,
              created_at: '',
              updated_at: '',
            },
          ],
          progress: { total: 1, completed: 0, percentage: 0 },
        }),
      ),
      listProjectTasks: vi.fn(() =>
        of({
          tasks: [
            {
              id: '31',
              project_id: '5',
              milestone_id: '12',
              assignee_id: '9',
              title: 'Prepare mockups',
              description: null,
              status: 'in_progress',
              priority: 'high',
              due_date: null,
              position: 0,
              created_at: '',
              updated_at: '',
            },
          ],
        }),
      ),
      listProjectActivity: vi.fn(() => of({ activity: [] })),
      createMilestone: vi.fn(() =>
        of({ message: 'Milestone created.', milestone: {} }),
      ),
      moveTask: vi.fn(() => of({ message: 'Task moved.', task: {} })),
      updateTask: vi.fn(() => of({ message: 'Task updated.', task: {} })),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectWorkspaceComponent],
      providers: [{ provide: ProjectService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectWorkspaceComponent);
    fixture.componentRef.setInput('projectId', '5');
    fixture.componentRef.setInput('projectStatus', 'in_progress');
    fixture.componentRef.setInput('role', 'freelancer');
    fixture.componentRef.setInput('currentUserId', '9');
    fixture.detectChanges();
  });

  it('loads and displays milestones and Kanban tasks', () => {
    expect(service.listProjectMilestones).toHaveBeenCalledWith('5');
    expect(service.listProjectTasks).toHaveBeenCalledWith('5');
    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('Design review');
    expect(page.textContent).toContain('Prepare mockups');
    expect(page.textContent).toContain('Task board');
  });

  it('offers assigned freelancers the next allowed task transition', () => {
    const component = fixture.componentInstance;
    expect(component.taskMoveOptions(component.tasks[0]!)).toEqual(['review']);
    component.moveTask(component.tasks[0]!, 'review', 0);
    expect(service.moveTask).toHaveBeenCalledWith('31', 'review', 0);
  });

  it('does not offer task transitions to an unassigned freelancer', () => {
    const component = fixture.componentInstance;
    const task = { ...component.tasks[0]!, assignee_id: 'other-freelancer' };
    expect(component.taskMoveOptions(task)).toEqual([]);
    expect(component.canDragTask(task)).toBe(false);
  });

  it('updates task details for a client', () => {
    fixture.componentRef.setInput('role', 'client');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const task = component.tasks[0]!;
    component.beginTaskEdit(task);
    component.editTaskTitle = 'Updated task title';

    component.saveTask(task);

    expect(service.updateTask).toHaveBeenCalledWith('31', {
      title: 'Updated task title',
      description: null,
      priority: 'high',
      due_date: null,
      milestone_id: '12',
      assignee_id: '9',
    });
  });

  it('creates a milestone with the form values for a client', () => {
    fixture.componentRef.setInput('role', 'client');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.milestoneTitle = 'Implementation';
    component.milestoneDescription = 'Build the approved design.';
    component.milestoneAmount = 500;
    component.milestoneDueDate = '2026-12-01';

    component.createMilestone();

    expect(service.createMilestone).toHaveBeenCalledWith('5', {
      title: 'Implementation',
      description: 'Build the approved design.',
      amount: 500,
      due_date: '2026-12-01',
    });
  });
});
