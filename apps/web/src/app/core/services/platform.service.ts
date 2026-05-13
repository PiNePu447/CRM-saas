import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantStats {
  users: number;
  contacts: number;
  deals: number;
  companies?: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  createdAt: string;
  deletedAt: string | null;
  _count: TenantStats;
}

export interface TenantDetail extends Tenant {
  users: TenantUser[];
}

export interface CreateTenantPayload {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  settings?: Record<string, unknown>;
}

export interface UpdateTenantPayload {
  name?: string;
  settings?: Record<string, unknown>;
  active?: boolean;
}

export interface CreateSuperAdminPayload {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly api = `${environment.apiUrl}/platform`;

  constructor(private readonly http: HttpClient) {}

  listTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.api}/tenants`);
  }

  getTenant(id: string): Observable<TenantDetail> {
    return this.http.get<TenantDetail>(`${this.api}/tenants/${id}`);
  }

  createTenant(payload: CreateTenantPayload): Observable<TenantDetail> {
    return this.http.post<TenantDetail>(`${this.api}/tenants`, payload);
  }

  updateTenant(id: string, payload: UpdateTenantPayload): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.api}/tenants/${id}`, payload);
  }

  deleteTenant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/tenants/${id}`);
  }

  createSuperAdmin(tenantId: string, payload: CreateSuperAdminPayload): Observable<TenantUser> {
    return this.http.post<TenantUser>(`${this.api}/tenants/${tenantId}/super-admins`, payload);
  }
}
