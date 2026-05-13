export type ContactStatus = 'LEAD' | 'QUALIFIED' | 'CUSTOMER' | 'CHURNED' | 'LOST';

export interface Contact {
  id: string;
  tenantId: string;
  ownerId: string;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  status: ContactStatus;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string };
  owner?: { id: string; name: string };
  tags?: { tag: Tag }[];
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  customFields: Record<string, unknown>;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type ActivityType =
  | 'NOTE'
  | 'EMAIL'
  | 'CALL'
  | 'MEETING'
  | 'STATUS_CHANGE'
  | 'DEAL_MOVED'
  | 'TASK_CREATED';

export interface Activity {
  id: string;
  type: ActivityType;
  content: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
