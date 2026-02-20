import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Task, TaskCreate, TaskStatus } from '../../models/task.model';
import { TaskQuery, TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-page',
  templateUrl: './task-page.component.html',
  styleUrls: ['./task-page.component.css']
})
export class TaskPageComponent implements OnInit {
  tasks: Task[] = [];
  selectedTask: Task | null = null;
  formMode: 'create' | 'edit' = 'create';
  isLoading = false;
  isSaving = false;
  isReordering = false;
  statusUpdatingId: string | null = null;
  errorMessage = '';
  totalItems = 0;
  page = 1;
  pageSize = 6;
  sortBy: TaskQuery['sortBy'] = 'priority';
  sortOrder: TaskQuery['order'] = 'desc';
  statusFilter: TaskQuery['status'] = undefined;

  readonly statusOptions: TaskStatus[] = ['todo', 'in-progress', 'done'];
  readonly syncStatus$ = this.taskService.syncStatus$;
  readonly filterOptions: Array<{ label: string; value: TaskQuery['status'] }> = [
    { label: 'All status', value: undefined },
    { label: 'To do', value: 'todo' },
    { label: 'In progress', value: 'in-progress' },
    { label: 'Done', value: 'done' }
  ];
  readonly sortOptions: Array<{ label: string; value: TaskQuery['sortBy'] }> = [
    { label: 'Due date', value: 'dueDate' },
    { label: 'Created date', value: 'createdAt' },
    { label: 'Priority', value: 'priority' }
  ];
  readonly orderOptions: Array<{ label: string; value: TaskQuery['order'] }> = [
    { label: 'Descending', value: 'desc' },
    { label: 'Ascending', value: 'asc' }
  ];
  readonly pageSizeOptions = [6, 10, 15];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: TaskQuery = {
      page: this.page,
      limit: this.pageSize,
      sortBy: this.sortBy,
      order: this.sortOrder,
      status: this.statusFilter
    };

    this.taskService.getTasks(query).subscribe({
      next: (response) => {
        this.tasks = response.items;
        this.totalItems = response.total;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load tasks. Please try again.';
        this.isLoading = false;
      }
    });
  }

  startCreate(): void {
    this.selectedTask = null;
    this.formMode = 'create';
  }

  startEdit(task: Task): void {
    this.selectedTask = task;
    this.formMode = 'edit';
  }

  cancelEdit(): void {
    this.selectedTask = null;
    this.formMode = 'create';
  }

  handleSave(payload: TaskCreate): void {
    this.isSaving = true;
    this.errorMessage = '';
    const timestamp = new Date().toISOString();

    if (this.formMode === 'edit' && this.selectedTask?.id) {
      const updatePayload: Partial<TaskCreate> = {
        ...payload,
        updatedAt: timestamp
      };

      this.taskService.updateTask(this.selectedTask.id, updatePayload).subscribe({
        next: (updatedTask) => {
          this.loadTasks();
          this.isSaving = false;
          this.cancelEdit();
        },
        error: (error: Error) => {
          this.errorMessage = error?.message || 'Unable to update task. Please try again.';
          this.isSaving = false;
        }
      });
      return;
    }

    const createPayload: TaskCreate = {
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp,
      priority: this.totalItems + 1
    };

    this.taskService.createTask(createPayload).subscribe({
      next: () => {
        this.page = 1;
        this.loadTasks();
        this.isSaving = false;
      },
      error: () => {
        this.errorMessage = 'Unable to create task. Please try again.';
        this.isSaving = false;
      }
    });
  }

  handleDelete(task: Task): void {
    if (!task.id) {
      return;
    }

    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        if (this.tasks.length === 1 && this.page > 1) {
          this.page -= 1;
        }
        this.loadTasks();
        this.isSaving = false;
        if (this.selectedTask?.id === task.id) {
          this.cancelEdit();
        }
      },
      error: () => {
        this.errorMessage = 'Unable to delete task. Please try again.';
        this.isSaving = false;
      }
    });
  }

  handleStatusChange(update: { task: Task; status: TaskStatus }): void {
    const { task, status } = update;
    if (!task.id || task.status === status) {
      return;
    }

    this.statusUpdatingId = task.id;
    this.errorMessage = '';

    this.taskService.updateTask(task.id, { status, updatedAt: new Date().toISOString() }).subscribe({
      next: (updatedTask) => {
        this.loadTasks();
        this.statusUpdatingId = null;
      },
      error: (error: Error) => {
        this.errorMessage = error?.message || 'Unable to update status. Please try again.';
        this.statusUpdatingId = null;
      }
    });
  }

  handleReorder(update: { dragId: string; targetId: string }): void {
    if (update.dragId === update.targetId) {
      return;
    }

    this.isReordering = true;
    this.errorMessage = '';

    const query: TaskQuery = {
      page: 1,
      limit: 1000,
      sortBy: 'priority',
      order: 'asc'
    };

    this.taskService.getTasks(query).subscribe({
      next: (response) => {
        const tasks = [...response.items];
        const fromIndex = tasks.findIndex((task) => task.id === update.dragId);
        const toIndex = tasks.findIndex((task) => task.id === update.targetId);

        if (fromIndex < 0 || toIndex < 0) {
          this.isReordering = false;
          return;
        }

        const [moved] = tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, moved);

        const updates = tasks
          .map((task, index) => ({ task, priority: index + 1 }))
          .filter((entry) => entry.task.id && entry.task.priority !== entry.priority)
          .map((entry) => this.taskService.updateTask(entry.task.id as string, { priority: entry.priority }));

        if (updates.length === 0) {
          this.isReordering = false;
          return;
        }

        forkJoin(updates).subscribe({
          next: () => {
            this.loadTasks();
            this.isReordering = false;
          },
          error: () => {
            this.errorMessage = 'Unable to reorder tasks. Please try again.';
            this.isReordering = false;
          }
        });
      },
      error: () => {
        this.errorMessage = 'Unable to reorder tasks. Please try again.';
        this.isReordering = false;
      }
    });
  }

  get totalCount(): number {
    return this.totalItems;
  }

  get todoCount(): number {
    return this.tasks.filter((task) => task.status === 'todo').length;
  }

  get inProgressCount(): number {
    return this.tasks.filter((task) => task.status === 'in-progress').length;
  }

  get doneCount(): number {
    return this.tasks.filter((task) => task.status === 'done').length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get hasPreviousPage(): boolean {
    return this.page > 1;
  }

  get hasNextPage(): boolean {
    return this.page < this.totalPages;
  }

  updateFilter(value: string): void {
    this.statusFilter = value ? (value as TaskQuery['status']) : undefined;
    this.page = 1;
    this.loadTasks();
  }

  updateOrder(value: TaskQuery['order']): void {
    this.sortOrder = value;
    this.page = 1;
    this.loadTasks();
  }

  updateSort(value: TaskQuery['sortBy']): void {
    this.sortBy = value;
    this.page = 1;
    this.loadTasks();
  }

  updatePageSize(value: number): void {
    this.pageSize = value;
    this.page = 1;
    this.loadTasks();
  }

  goToPreviousPage(): void {
    if (!this.hasPreviousPage) {
      return;
    }
    this.page -= 1;
    this.loadTasks();
  }

  goToNextPage(): void {
    if (!this.hasNextPage) {
      return;
    }
    this.page += 1;
    this.loadTasks();
  }
}
