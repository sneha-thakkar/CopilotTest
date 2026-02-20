import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Task, TaskCreate, TaskPriorityLevel, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnChanges {
  @Input() task: Task | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() statusOptions: TaskStatus[] = [];
  @Input() isSaving = false;

  @Output() save = new EventEmitter<TaskCreate>();
  @Output() cancel = new EventEmitter<void>();

  readonly priorityOptions: TaskPriorityLevel[] = ['low', 'medium', 'high'];

  form = this.formBuilder.group(
    {
      title: ['', [Validators.required, Validators.maxLength(80)]],
      description: ['', [Validators.maxLength(240)]],
      status: ['todo' as TaskStatus, [Validators.required]],
      priorityLevel: ['medium' as TaskPriorityLevel, [Validators.required]],
      dueDate: ['']
    },
    { validators: this.highPriorityDueDateValidator() }
  );

  constructor(private formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task']) {
      if (this.task) {
        this.form.patchValue({
          title: this.task.title,
          description: this.task.description || '',
          status: this.task.status,
          priorityLevel: this.task.priorityLevel || 'medium',
          dueDate: this.task.dueDate || ''
        });
      } else {
        this.form.reset({
          title: '',
          description: '',
          status: 'todo',
          priorityLevel: 'medium',
          dueDate: ''
        });
      }
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.getRawValue() as TaskCreate);
    if (this.mode === 'create') {
      this.form.reset({
        title: '',
        description: '',
        status: 'todo',
        priorityLevel: 'medium',
        dueDate: ''
      });
    }
  }

  get titleLabel(): string {
    return this.mode === 'edit' ? 'Edit task' : 'Create task';
  }

  get dueDateError(): string {
    if (!this.form.errors?.['highPriorityDueDate']) {
      return '';
    }
    return 'High priority tasks must have a due date within 7 days.';
  }

  private highPriorityDueDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as { value?: { priorityLevel?: TaskPriorityLevel; dueDate?: string } };
      const priority = group.value?.priorityLevel;
      const dueDate = group.value?.dueDate;

      if (priority !== 'high') {
        return null;
      }

      if (!dueDate) {
        return { highPriorityDueDate: true };
      }

      const due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) {
        return { highPriorityDueDate: true };
      }

      const now = new Date();
      const max = new Date(now);
      max.setDate(now.getDate() + 7);

      if (due > max || due < now) {
        return { highPriorityDueDate: true };
      }

      return null;
    };
  }
}
