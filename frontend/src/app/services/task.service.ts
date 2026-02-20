import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, concatMap, from, map, Observable, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Task, TaskCreate } from '../models/task.model';

export interface TaskQuery {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'dueDate';
  order: 'asc' | 'desc';
  status?: 'todo' | 'in-progress' | 'done';
}

export interface TaskPage {
  items: Task[];
  total: number;
}

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

interface QueuedAction {
  type: 'create' | 'update' | 'delete';
  id?: string;
  tempId?: string;
  payload?: TaskCreate | Partial<TaskCreate>;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly baseUrl = `${API_BASE_URL}/tasks`;
  private readonly storageKey = 'task-cache';
  private readonly queueKey = 'task-queue';
  private readonly idMapKey = 'task-id-map';
  private readonly syncStatusSubject = new BehaviorSubject<SyncStatus>(this.isOnline() ? 'online' : 'offline');
  private isSyncing = false;

  readonly syncStatus$ = this.syncStatusSubject.asObservable();

  constructor(private http: HttpClient) {
    this.registerConnectionListeners();
    if (this.isOnline()) {
      this.flushQueue();
    }
  }

  getTasks(query: TaskQuery): Observable<TaskPage> {
    if (!this.isOnline()) {
      const cached = this.readCache();
      const filtered = query.status ? cached.filter((task) => task.status === query.status) : cached;
      const sorted = this.sortTasks(filtered, query.sortBy, query.order);
      const start = (query.page - 1) * query.limit;
      const items = sorted.slice(start, start + query.limit);
      return of({ items, total: sorted.length });
    }

    let params = new HttpParams()
      .set('_page', query.page)
      .set('_limit', query.limit)
      .set('_sort', query.sortBy)
      .set('_order', query.order);

    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<Task[]>(this.baseUrl, { params, observe: 'response' }).pipe(
      map((response: HttpResponse<Task[]>) => ({
        items: response.body ?? [],
        total: Number(response.headers.get('X-Total-Count') || 0)
      })),
      map((page) => {
        this.mergeCache(page.items);
        return page;
      })
    );
  }

  createTask(payload: TaskCreate): Observable<Task> {
    if (!this.isOnline()) {
      const tempId = `local-${Date.now()}`;
      const task: Task = { ...payload, id: tempId };
      this.writeCache([...this.readCache(), task]);
      this.enqueue({ type: 'create', tempId, payload });
      return of(task);
    }

    return this.http.post<Task>(this.baseUrl, payload).pipe(
      map((created) => {
        this.mergeCache([created]);
        return created;
      })
    );
  }

  updateTask(id: string, changes: Partial<TaskCreate>): Observable<Task> {
    const existing = this.readCache().find((task) => task.id === id);
    if (existing?.status === 'done') {
      return throwError(() => new Error('Done tasks are read-only.'));
    }
    if (!this.isOnline()) {
      const cached = this.readCache();
      const updated = cached.map((task) => (task.id === id ? { ...task, ...changes } : task));
      const updatedTask: Task = {
        ...(existing ?? { id, title: '', status: 'todo' }),
        ...changes
      };
      this.writeCache(updated);
      this.enqueue({ type: 'update', id, payload: changes });
      return of(updatedTask);
    }

    return this.http.patch<Task>(`${this.baseUrl}/${id}`, changes).pipe(
      map((updated) => {
        this.mergeCache([updated]);
        return updated;
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    if (!this.isOnline()) {
      this.writeCache(this.readCache().filter((task) => task.id !== id));
      this.enqueue({ type: 'delete', id });
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(() => {
        this.writeCache(this.readCache().filter((task) => task.id !== id));
        return void 0;
      })
    );
  }

  private registerConnectionListeners(): void {
    if (!this.isBrowser()) {
      return;
    }

    window.addEventListener('online', () => {
      this.syncStatusSubject.next('online');
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.syncStatusSubject.next('offline');
    });
  }

  private enqueue(action: QueuedAction): void {
    const queue = this.readQueue();
    queue.push(action);
    this.writeQueue(queue);
    this.syncStatusSubject.next('offline');
  }

  private flushQueue(): void {
    if (this.isSyncing || !this.isOnline()) {
      return;
    }

    const queue = this.readQueue();
    if (queue.length === 0) {
      this.syncStatusSubject.next('online');
      return;
    }

    this.isSyncing = true;
    this.syncStatusSubject.next('syncing');
    const idMap = this.readIdMap();

    from(queue.map((action, index) => ({ action, index })))
      .pipe(concatMap((entry) => this.performQueuedAction(entry.action, queue, entry.index, idMap)))
      .subscribe({
      next: () => {},
      error: () => {
        this.syncStatusSubject.next('error');
        this.isSyncing = false;
      },
      complete: () => {
        this.writeQueue([]);
        this.isSyncing = false;
        this.syncStatusSubject.next('online');
      }
      });
  }

  private performQueuedAction(
    action: QueuedAction,
    queue: QueuedAction[],
    index: number,
    idMap: Record<string, string>
  ): Observable<void> {
    if (action.type === 'create' && action.payload) {
      const tempId = action.tempId as string;
      return this.http.post<Task>(this.baseUrl, action.payload).pipe(
        map((created) => {
          if (tempId && created.id) {
            idMap[tempId] = created.id;
            this.writeIdMap(idMap);
            this.replaceTempId(tempId, created.id);
            this.updateQueueIds(queue, tempId, created.id);
            this.writeQueue(queue.slice(index + 1));
          }
          return void 0;
        })
      );
    }

    if (action.type === 'update' && action.payload) {
      if (!action.id) {
        return throwError(() => new Error('Missing task id for update'));
      }
      const resolvedId = this.resolveId(action.id, idMap);
      return this.http.patch<Task>(`${this.baseUrl}/${resolvedId}`, action.payload).pipe(
        map((updated) => {
          this.mergeCache([updated]);
          this.writeQueue(queue.slice(index + 1));
          return void 0;
        })
      );
    }

    if (action.type === 'delete') {
      if (!action.id) {
        return throwError(() => new Error('Missing task id for delete'));
      }
      const resolvedId = this.resolveId(action.id, idMap);
      return this.http.delete<void>(`${this.baseUrl}/${resolvedId}`).pipe(
        map(() => {
          this.writeCache(this.readCache().filter((task) => task.id !== resolvedId));
          this.writeQueue(queue.slice(index + 1));
          return void 0;
        })
      );
    }

    return throwError(() => new Error('Unknown queued action'));
  }

  private resolveId(id: string, idMap: Record<string, string>): string {
    return idMap[id] || id;
  }

  private replaceTempId(tempId: string, realId: string): void {
    const updated = this.readCache().map((task) =>
      task.id === tempId ? { ...task, id: realId } : task
    );
    this.writeCache(updated);
  }

  private updateQueueIds(queue: QueuedAction[], tempId: string, realId: string): void {
    queue.forEach((action) => {
      if (action.id === tempId) {
        action.id = realId;
      }
    });
  }

  private sortTasks(tasks: Task[], sortBy: TaskQuery['sortBy'], order: TaskQuery['order']): Task[] {
    const direction = order === 'asc' ? 1 : -1;
    return [...tasks].sort((left, right) => {
      const leftValue = this.readSortValue(left, sortBy);
      const rightValue = this.readSortValue(right, sortBy);

      if (leftValue < rightValue) {
        return -1 * direction;
      }
      if (leftValue > rightValue) {
        return 1 * direction;
      }
      return 0;
    });
  }

  private readSortValue(task: Task, sortBy: TaskQuery['sortBy']): string | number {
    switch (sortBy) {
      case 'title':
        return (task.title || '').toLowerCase();
      case 'updatedAt':
        return task.updatedAt || '';
      case 'dueDate':
        return task.dueDate || '';
      case 'priority':
        return task.priority ?? 0;
      default:
        return task.createdAt || '';
    }
  }

  private mergeCache(tasks: Task[]): void {
    const cached = this.readCache();
    const mapById = new Map<string, Task>();
    cached.forEach((task) => {
      if (task.id) {
        mapById.set(task.id, task);
      }
    });
    tasks.forEach((task) => {
      if (task.id) {
        mapById.set(task.id, { ...mapById.get(task.id), ...task });
      }
    });
    this.writeCache(Array.from(mapById.values()));
  }

  private readCache(): Task[] {
    if (!this.isBrowser()) {
      return [];
    }
    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  }

  private writeCache(tasks: Task[]): void {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  private readQueue(): QueuedAction[] {
    if (!this.isBrowser()) {
      return [];
    }
    const raw = window.localStorage.getItem(this.queueKey);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as QueuedAction[];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: QueuedAction[]): void {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  private readIdMap(): Record<string, string> {
    if (!this.isBrowser()) {
      return {};
    }
    const raw = window.localStorage.getItem(this.idMapKey);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return {};
    }
  }

  private writeIdMap(map: Record<string, string>): void {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(this.idMapKey, JSON.stringify(map));
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private isOnline(): boolean {
    return this.isBrowser() ? window.navigator.onLine : true;
  }
}
