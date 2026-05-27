import { Component, OnInit } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ContactsService } from '../../../core/services/contacts.service';
import { Contact, PaginatedResponse } from '../../../core/models/contact.models';

@Component({ standalone: false,
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
})
export class ContactListComponent implements OnInit {
  contacts: Contact[] = [];
  meta = { total: 0, page: 1, limit: 25, totalPages: 1 };
  loading = false;
  search = '';
  statusFilter = '';
  private searchSubject = new Subject<string>();
  Math = Math;

  constructor(private readonly contactsService: ContactsService) {}

  ngOnInit(): void {
    this.loadContacts();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.meta.page = 1;
        this.loadContacts();
      });
  }

  loadContacts(): void {
    this.loading = true;
    this.contactsService
      .list({
        page: this.meta.page,
        limit: this.meta.limit,
        search: this.search || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res: PaginatedResponse<Contact>) => {
          this.contacts = res.data;
          this.meta = res.meta;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  onSearch(value: string): void {
    this.search = value;
    this.searchSubject.next(value);
  }

  onStatusChange(value: string): void {
    this.statusFilter = value;
    this.meta.page = 1;
    this.loadContacts();
  }

  goToPage(page: number): void {
    this.meta.page = page;
    this.loadContacts();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      LEAD: 'badge-gray',
      QUALIFIED: 'badge-blue',
      CUSTOMER: 'badge-green',
      CHURNED: 'badge-amber',
      LOST: 'badge-red',
    };
    return map[status] ?? 'badge-gray';
  }

  getStatusBadgeClasses(status: string): string {
    const map: Record<string, string> = {
      LEAD: 'bg-surface-container-high text-primary border-primary/20',
      QUALIFIED: 'bg-secondary-container/20 text-secondary border-secondary/20',
      CUSTOMER: 'bg-[#16a34a]/20 text-[#16a34a] border-[#16a34a]/20',
      CHURNED: 'bg-error-container/20 text-error border-error/20',
      LOST: 'bg-error-container/20 text-error border-error/20',
    };
    return map[status] ?? 'bg-surface-container-high text-primary border-primary/20';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      LEAD: 'Lead',
      QUALIFIED: 'Qualificado',
      CUSTOMER: 'Cliente',
      CHURNED: 'Perdido',
      LOST: 'Perdido',
    };
    return map[status] ?? status;
  }
}

