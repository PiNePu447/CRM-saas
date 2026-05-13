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
}
