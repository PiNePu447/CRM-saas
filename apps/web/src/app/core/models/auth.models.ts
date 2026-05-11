export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  tenant: TenantInfo;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenant?: TenantInfo;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'SELLER';
