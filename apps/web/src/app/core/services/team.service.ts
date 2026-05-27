import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER';
  isActive: boolean;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
  manager?: { id: string; name: string; email: string } | null;
  sellers?: { id: string; name: string; email: string; role: string; isActive: boolean }[];
}

export interface InviteUserPayload {
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER';
  temporaryPassword: string;
  managerId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: 'ADMIN' | 'MANAGER' | 'SELLER';
  isActive?: boolean;
  managerId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly api = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<TeamUser[]> {
    return this.http.get<TeamUser[]>(this.api);
  }

  getById(id: string): Observable<TeamUser> {
    return this.http.get<TeamUser>(`${this.api}/${id}`);
  }

  invite(payload: InviteUserPayload): Observable<TeamUser> {
    return this.http.post<TeamUser>(`${this.api}/invite`, payload);
  }

  update(id: string, payload: UpdateUserPayload): Observable<TeamUser> {
    return this.http.patch<TeamUser>(`${this.api}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  assignManager(sellerId: string, managerId: string | null): Observable<TeamUser> {
    return this.http.patch<TeamUser>(`${this.api}/${sellerId}/assign-manager`, { managerId });
  }
}
