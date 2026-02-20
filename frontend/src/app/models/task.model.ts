export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriorityLevel = 'low' | 'medium' | 'high';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
  priority?: number;
  priorityLevel?: TaskPriorityLevel;
  dueDate?: string;
}

export type TaskCreate = Omit<Task, 'id'>;
