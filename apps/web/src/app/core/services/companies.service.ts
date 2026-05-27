import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CompanyStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'CHURNED';

export interface CompanyOwner {
  id: string;
  name: string;
  email: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  status?: CompanyStatus;
  ownerId?: string | null;
  owner?: CompanyOwner | null;
  _count?: { contacts: number };
}

export interface CompanyWithContacts extends Company {
  contacts: {
    id: string;
    name: string;
    email?: string;
    status: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly api = `${environment.apiUrl}/companies`;

  constructor(private readonly http: HttpClient) {}

  list(search?: string): Observable<Company[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<Company[]>(this.api, { params });
  }

  getById(id: string): Observable<CompanyWithContacts> {
    return this.http.get<CompanyWithContacts>(`${this.api}/${id}`);
  }

  create(data: Partial<Company> & { ownerId?: string | null }): Observable<Company> {
    return this.http.post<Company>(this.api, data);
  }

  update(id: string, data: Partial<Company> & { ownerId?: string | null }): Observable<Company> {
    return this.http.patch<Company>(`${this.api}/${id}`, data);
  }

  assignOwner(id: string, ownerId: string | null): Observable<Company> {
    return this.http.patch<Company>(`${this.api}/${id}/assign-owner`, { ownerId });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
