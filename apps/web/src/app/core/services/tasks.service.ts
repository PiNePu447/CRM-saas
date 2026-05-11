import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/task.models';

export interface TaskFilters {
  contactId?: string;
  dealId?: string;
  assignedTo?: string;
  completed?: boolean;
  dueBefore?: string;
  dueAfter?: string;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly api = `${environment.apiUrl}/tasks`;

  constructor(private readonly http: HttpClient) {}

  list(filters: TaskFilters = {}): Observable<Task[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<Task[]>(this.api, { params });
  }

  getCalendar(start: string, end: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.api}/calendar`, {
      params: new HttpParams().set('start', start).set('end', end),
    });
  }

  create(data: Partial<Task> & { title: string }): Observable<Task> {
    return this.http.post<Task>(this.api, data);
  }

  update(id: string, data: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.api}/${id}`, data);
  }

  complete(id: string): Observable<Task> {
    return this.http.patch<Task>(`${this.api}/${id}/complete`, {});
  }

  reopen(id: string): Observable<Task> {
    return this.http.patch<Task>(`${this.api}/${id}/reopen`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
