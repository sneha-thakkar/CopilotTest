import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TaskFormComponent } from './task-form.component';
import { TaskStatus } from '../../models/task.model';

describe('TaskFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [TaskFormComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should emit save on valid submit', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    component.statusOptions = ['todo', 'in-progress', 'done'] as TaskStatus[];
    fixture.detectChanges();

    component.form.setValue({
      title: 'Plan sprint',
      description: 'Outline deliverables',
      status: 'todo',
      priorityLevel: 'medium',
      dueDate: ''
    });

    const saveSpy = spyOn(component.save, 'emit');
    component.submit();

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should not emit save when invalid', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    const saveSpy = spyOn(component.save, 'emit');
    component.submit();
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should require a due date within 7 days for high priority', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    const saveSpy = spyOn(component.save, 'emit');

    const future = new Date();
    future.setDate(future.getDate() + 10);

    component.form.setValue({
      title: 'Urgent task',
      description: '',
      status: 'todo',
      priorityLevel: 'high',
      dueDate: future.toISOString().slice(0, 10)
    });

    component.submit();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should allow high priority with due date within 7 days', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    const saveSpy = spyOn(component.save, 'emit');

    const future = new Date();
    future.setDate(future.getDate() + 3);

    component.form.setValue({
      title: 'Urgent task',
      description: '',
      status: 'todo',
      priorityLevel: 'high',
      dueDate: future.toISOString().slice(0, 10)
    });

    component.submit();

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should show cancel button in edit mode', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    const component = fixture.componentInstance;
    component.mode = 'edit';
    fixture.detectChanges();
    const cancelButton = fixture.nativeElement.querySelector('button.btn.ghost') as HTMLButtonElement;
    expect(cancelButton?.textContent).toContain('Cancel');
  });
});
