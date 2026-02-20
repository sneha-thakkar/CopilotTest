import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TaskPageComponent } from './task-page.component';
import { TaskCreate } from '../../models/task.model';
import { TaskQuery, TaskService } from '../../services/task.service';

class TaskServiceStub {
  getTasks = jasmine.createSpy('getTasks').and.returnValue(of({ items: [], total: 0 }));
  createTask = jasmine.createSpy('createTask').and.returnValue(of({}));
  updateTask = jasmine.createSpy('updateTask').and.returnValue(of({}));
  deleteTask = jasmine.createSpy('deleteTask').and.returnValue(of(void 0));
}

describe('TaskPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskPageComponent],
      providers: [{ provide: TaskService, useClass: TaskServiceStub }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TaskPageComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    const fixture = TestBed.createComponent(TaskPageComponent);
    const component = fixture.componentInstance;
    const service = TestBed.inject(TaskService) as unknown as TaskServiceStub;

    fixture.detectChanges();

    const expected: TaskQuery = {
      page: 1,
      limit: 6,
      sortBy: 'priority',
      order: 'desc',
      status: undefined
    };

    expect(service.getTasks).toHaveBeenCalledWith(expected);
  });

  it('should update filter and reload', () => {
    const fixture = TestBed.createComponent(TaskPageComponent);
    const component = fixture.componentInstance;
    const service = TestBed.inject(TaskService) as unknown as TaskServiceStub;

    component.page = 3;
    component.updateFilter('todo');

    expect(component.page).toBe(1);
    expect(service.getTasks).toHaveBeenCalled();
  });

  it('should create a new task in create mode', () => {
    const fixture = TestBed.createComponent(TaskPageComponent);
    const component = fixture.componentInstance;
    const service = TestBed.inject(TaskService) as unknown as TaskServiceStub;

    const payload: TaskCreate = {
      title: 'Plan sprint',
      description: '',
      status: 'todo',
      priorityLevel: 'medium',
      dueDate: ''
    };
    component.handleSave(payload);

    expect(service.createTask).toHaveBeenCalled();
  });

  it('should update a task in edit mode', () => {
    const fixture = TestBed.createComponent(TaskPageComponent);
    const component = fixture.componentInstance;
    const service = TestBed.inject(TaskService) as unknown as TaskServiceStub;

    component.formMode = 'edit';
    component.selectedTask = { id: '1', title: 'Task', status: 'todo' };

    const payload: TaskCreate = {
      title: 'Updated',
      description: '',
      status: 'todo',
      priorityLevel: 'low',
      dueDate: ''
    };
    component.handleSave(payload);

    expect(service.updateTask).toHaveBeenCalled();
  });

  it('should update sort and reload', () => {
    const fixture = TestBed.createComponent(TaskPageComponent);
    const component = fixture.componentInstance;
    const service = TestBed.inject(TaskService) as unknown as TaskServiceStub;

    component.updateSort('dueDate');

    expect(component.sortBy).toBe('dueDate');
    expect(service.getTasks).toHaveBeenCalled();
  });
});
