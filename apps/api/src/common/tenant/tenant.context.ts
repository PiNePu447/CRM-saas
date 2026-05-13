import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string | null;
  userId: string;
  userRole: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantContext(): TenantStore {
  const store = tenantStorage.getStore();
  if (!store) {
    throw new Error('No tenant context found. Ensure TenantMiddleware is applied.');
  }
  return store;
}
