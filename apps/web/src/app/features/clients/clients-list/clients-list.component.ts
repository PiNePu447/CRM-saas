import { Component, OnInit } from '@angular/core';
import { CompaniesService, Company, CompanyWithContacts } from '../../../core/services/companies.service';

interface CompanyRow extends Company {
  expanded: boolean;
  loadingContacts: boolean;
  contacts?: CompanyWithContacts['contacts'];
}

@Component({
  standalone: false,
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  companies: CompanyRow[] = [];
  loading = false;
  search = '';
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  modalVisible = false;
  editingCompany: Company | null = null;
  deleteConfirmId: string | null = null;
  deleting = false;

  constructor(private readonly companiesService: CompaniesService) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading = true;
    this.companiesService.list(this.search || undefined).subscribe({
      next: (companies) => {
        this.companies = companies.map((c) => ({
          ...c,
          expanded: false,
          loadingContacts: false,
        }));
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadCompanies(), 300);
  }

  toggleCompany(row: CompanyRow): void {
    row.expanded = !row.expanded;

    if (row.expanded && !row.contacts) {
      row.loadingContacts = true;
      this.companiesService.getById(row.id).subscribe({
        next: (company) => {
          row.contacts = company.contacts;
          row.loadingContacts = false;
        },
        error: () => (row.loadingContacts = false),
      });
    }
  }

  openCreateModal(): void {
    this.editingCompany = null;
    this.modalVisible = true;
  }

  openEditModal(company: Company, event: Event): void {
    event.stopPropagation();
    this.editingCompany = company;
    this.modalVisible = true;
  }

  onModalClosed(): void {
    this.modalVisible = false;
    this.editingCompany = null;
  }

  onCompanySaved(company: Company): void {
    this.modalVisible = false;
    this.editingCompany = null;

    const idx = this.companies.findIndex((c) => c.id === company.id);
    if (idx >= 0) {
      this.companies[idx] = { ...this.companies[idx], ...company };
    } else {
      this.loadCompanies();
    }
  }

  confirmDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteCompany(): void {
    if (!this.deleteConfirmId) return;
    this.deleting = true;

    this.companiesService.delete(this.deleteConfirmId).subscribe({
      next: () => {
        this.companies = this.companies.filter((c) => c.id !== this.deleteConfirmId);
        this.deleteConfirmId = null;
        this.deleting = false;
      },
      error: () => {
        this.deleting = false;
      },
    });
  }

  contactStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      LEAD: 'Lead',
      QUALIFIED: 'Qualificado',
      CUSTOMER: 'Cliente',
      CHURNED: 'Churn',
      LOST: 'Perdido',
    };
    return labels[status] ?? status;
  }

  contactStatusClass(status: string): string {
    const classes: Record<string, string> = {
      LEAD: 'badge-gray',
      QUALIFIED: 'badge-blue',
      CUSTOMER: 'badge-green',
      CHURNED: 'badge-yellow',
      LOST: 'badge-red',
    };
    return classes[status] ?? 'badge-gray';
  }

  companyStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      PROSPECT: 'Prospecto',
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      CHURNED: 'Churn',
    };
    return labels[status ?? ''] ?? '';
  }

  companyStatusClass(status: string | undefined): string {
    const classes: Record<string, string> = {
      PROSPECT: 'badge-gray',
      ACTIVE: 'badge-green',
      INACTIVE: 'badge-yellow',
      CHURNED: 'badge-red',
    };
    return classes[status ?? ''] ?? 'badge-gray';
  }
}
