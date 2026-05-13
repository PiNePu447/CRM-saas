import { Component, OnInit } from '@angular/core';
import {
  CreateSuperAdminPayload,
  CreateTenantPayload,
  PlatformService,
  Tenant,
  TenantDetail,
} from '../../../core/services/platform.service';
import { AuthService } from '../../../core/services/auth.service';

type ModalMode = 'create-tenant' | 'edit-tenant' | 'create-super-admin' | null;

@Component({
  standalone: false,
  selector: 'app-tenant-list',
  templateUrl: './tenant-list.component.html',
})
export class TenantListComponent implements OnInit {
  tenants: Tenant[] = [];
  loading = false;
  search = '';

  modalMode: ModalMode = null;
  selectedTenant: TenantDetail | null = null;
  loadingTenant = false;

  tenantForm: Partial<CreateTenantPayload> = {};
  superAdminForm: Partial<CreateSuperAdminPayload> = {};
  saving = false;
  formError = '';

  deleteConfirmId: string | null = null;
  deleting = false;

  constructor(
    private readonly platformService: PlatformService,
    readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.loading = true;
    this.platformService.listTenants().subscribe({
      next: (t) => { this.tenants = t; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  get filteredTenants(): Tenant[] {
    if (!this.search) return this.tenants;
    const q = this.search.toLowerCase();
    return this.tenants.filter((t) => t.name.toLowerCase().includes(q) || t.slug.includes(q));
  }

  openCreateTenant(): void {
    this.tenantForm = {};
    this.formError = '';
    this.modalMode = 'create-tenant';
  }

  openEditTenant(tenant: Tenant): void {
    this.tenantForm = { name: tenant.name };
    this.formError = '';
    this.loadingTenant = true;
    this.platformService.getTenant(tenant.id).subscribe({
      next: (detail) => { this.selectedTenant = detail; this.loadingTenant = false; },
      error: () => (this.loadingTenant = false),
    });
    this.modalMode = 'edit-tenant';
  }

  openCreateSuperAdmin(tenant: Tenant): void {
    this.superAdminForm = {};
    this.formError = '';
    this.loadingTenant = true;
    this.platformService.getTenant(tenant.id).subscribe({
      next: (detail) => { this.selectedTenant = detail; this.loadingTenant = false; },
      error: () => (this.loadingTenant = false),
    });
    this.modalMode = 'create-super-admin';
  }

  closeModal(): void {
    if (this.saving) return;
    this.modalMode = null;
    this.selectedTenant = null;
    this.tenantForm = {};
    this.superAdminForm = {};
    this.formError = '';
  }

  submitCreateTenant(): void {
    const f = this.tenantForm as CreateTenantPayload;
    if (!f.name?.trim() || !f.slug?.trim() || !f.adminEmail || !f.adminPassword || !f.adminName?.trim()) {
      this.formError = 'Preencha todos os campos obrigatórios.';
      return;
    }
    this.saving = true;
    this.formError = '';

    this.platformService.createTenant(f).subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadTenants(); },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message?.error ?? err.error?.message ?? 'Erro ao criar tenant.';
      },
    });
  }

  submitEditTenant(): void {
    if (!this.selectedTenant) return;
    const payload: { name?: string } = {};
    if (this.tenantForm.name?.trim()) payload.name = this.tenantForm.name.trim();
    if (!payload.name) { this.formError = 'Nome é obrigatório.'; return; }

    this.saving = true;
    this.formError = '';
    this.platformService.updateTenant(this.selectedTenant.id, payload).subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadTenants(); },
      error: () => { this.saving = false; this.formError = 'Erro ao atualizar tenant.'; },
    });
  }

  submitCreateSuperAdmin(): void {
    if (!this.selectedTenant) return;
    const f = this.superAdminForm as CreateSuperAdminPayload;
    if (!f.name?.trim() || !f.email || !f.password) {
      this.formError = 'Preencha todos os campos.';
      return;
    }
    this.saving = true;
    this.formError = '';
    this.platformService.createSuperAdmin(this.selectedTenant.id, f).subscribe({
      next: () => { this.saving = false; this.closeModal(); },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message?.error ?? err.error?.message ?? 'Erro ao criar super-admin.';
      },
    });
  }

  confirmDelete(id: string): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }

  deleteTenant(): void {
    if (!this.deleteConfirmId) return;
    this.deleting = true;
    this.platformService.deleteTenant(this.deleteConfirmId).subscribe({
      next: () => { this.tenants = this.tenants.filter((t) => t.id !== this.deleteConfirmId); this.deleteConfirmId = null; this.deleting = false; },
      error: () => (this.deleting = false),
    });
  }

  isActive(tenant: Tenant): boolean {
    return !tenant.deletedAt;
  }

  get activeTenantCount(): number {
    return this.tenants.filter((t) => !t.deletedAt).length;
  }

  reactivateTenant(id: string): void {
    this.platformService.updateTenant(id, { active: true }).subscribe({
      next: () => this.loadTenants(),
    });
  }
}
