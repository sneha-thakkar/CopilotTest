import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Input() statusOptions: TaskStatus[] = [];
  @Input() statusUpdatingId: string | null = null;

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() statusChange = new EventEmitter<{ task: Task; status: TaskStatus }>();
  @Output() reorder = new EventEmitter<{ dragId: string; targetId: string }>();

  draggingId: string | null = null;
  dragOverId: string | null = null;
  readOnlyTaskId: string | null = null;

  trackById(index: number, task: Task): string {
    return task.id || `${task.title}-${index}`;
  }

  onStatusChange(task: Task, status: TaskStatus): void {
    this.statusChange.emit({ task, status });
  }

  onEditClick(task: Task): void {
    if (task.status === 'done') {
      this.readOnlyTaskId = task.id || null;
      return;
    }

    this.readOnlyTaskId = null;
    this.edit.emit(task);
  }

  onDragStart(event: DragEvent, task: Task): void {
    if (!task.id) {
      return;
    }
    this.draggingId = task.id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }
  }

  onDragOver(event: DragEvent, task: Task): void {
    event.preventDefault();
    if (task.id) {
      this.dragOverId = task.id;
    }
  }

  onDragLeave(task: Task): void {
    if (this.dragOverId === task.id) {
      this.dragOverId = null;
    }
  }

  onDrop(event: DragEvent, task: Task): void {
    event.preventDefault();
    const dragId = this.draggingId;
    const targetId = task.id;
    this.draggingId = null;
    this.dragOverId = null;

    if (dragId && targetId && dragId !== targetId) {
      this.reorder.emit({ dragId, targetId });
    }
  }

  onDragEnd(): void {
    this.draggingId = null;
    this.dragOverId = null;
  }
}
