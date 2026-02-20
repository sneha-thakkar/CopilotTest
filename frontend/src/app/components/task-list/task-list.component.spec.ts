import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { Task } from '../../models/task.model';

describe('TaskListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [TaskListComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should show empty state when no tasks', () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.empty') as HTMLElement;
    expect(empty).toBeTruthy();
  });

  it('should emit edit and delete events', () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    const component = fixture.componentInstance;
    component.tasks = [
      { id: '1', title: 'Task', status: 'todo', createdAt: '2026-02-18T00:00:00.000Z' } as Task
    ];
    component.statusOptions = ['todo', 'in-progress', 'done'];
    fixture.detectChanges();

    const editSpy = spyOn(component.edit, 'emit');
    const deleteSpy = spyOn(component.delete, 'emit');

    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalled();
  });

  it('should show read-only message when editing a done task', () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    const component = fixture.componentInstance;
    component.tasks = [
      { id: '1', title: 'Done task', status: 'done', createdAt: '2026-02-18T00:00:00.000Z' } as Task
    ];
    component.statusOptions = ['todo', 'in-progress', 'done'];
    fixture.detectChanges();

    const editSpy = spyOn(component.edit, 'emit');
    const editButton = fixture.nativeElement.querySelector('button.btn.ghost') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.read-only') as HTMLElement;
    expect(editSpy).not.toHaveBeenCalled();
    expect(message?.textContent).toContain('read-only');
  });

  it('should emit status change', () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    const component = fixture.componentInstance;
    component.tasks = [
      { id: '1', title: 'Task', status: 'todo', createdAt: '2026-02-18T00:00:00.000Z' } as Task
    ];
    component.statusOptions = ['todo', 'in-progress', 'done'];
    fixture.detectChanges();

    const statusSpy = spyOn(component.statusChange, 'emit');
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'done';
    select.dispatchEvent(new Event('change'));

    expect(statusSpy).toHaveBeenCalled();
  });
});
