import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Contact, Activity, PaginatedResponse } from '../models/contact.models';

export interface ContactFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ownerId?: string;
  companyId?: string;
  tagId?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly api = `${environment.apiUrl}/contacts`;

  constructor(private readonly http: HttpClient) {}

  list(filters: ContactFilters = {}): Observable<PaginatedResponse<Contact>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Contact>>(this.api, { params });
  }

  getById(id: string): Observable<Contact> {
    return this.http.get<Contact>(`${this.api}/${id}`);
  }

  create(data: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(this.api, data);
  }

  update(id: string, data: Partial<Contact>): Observable<Contact> {
    return this.http.patch<Contact>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getTimeline(id: string, cursor?: string): Observable<{ data: Activity[]; nextCursor: string | null }> {
    let params = new HttpParams();
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<{ data: Activity[]; nextCursor: string | null }>(
      `${this.api}/${id}/timeline`,
      { params },
    );
  }

  addActivity(id: string, data: { type: string; content: Record<string, unknown>; dealId?: string }): Observable<Activity> {
    return this.http.post<Activity>(`${this.api}/${id}/activities`, data);
  }
}
