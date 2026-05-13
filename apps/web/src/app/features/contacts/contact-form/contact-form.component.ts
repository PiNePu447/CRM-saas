import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService } from '../../../core/services/contacts.service';
import { CompaniesService, Company } from '../../../core/services/companies.service';
import { Contact, ContactStatus } from '../../../core/models/contact.models';

@Component({
  standalone: false,
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
})
export class ContactFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  contactId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  statusOptions: { value: ContactStatus; label: string }[] = [
    { value: 'LEAD', label: 'Lead' },
    { value: 'QUALIFIED', label: 'Qualificado' },
    { value: 'CUSTOMER', label: 'Cliente' },
    { value: 'CHURNED', label: 'Churn' },
    { value: 'LOST', label: 'Perdido' },
  ];

  companies: Company[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly contactsService: ContactsService,
    private readonly companiesService: CompaniesService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: [''],
      companyId: [''],
      birthDate: [''],
      status: ['LEAD'],
    });

    this.companiesService.list().subscribe({
      next: (companies) => (this.companies = companies),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.contactId = id;
      this.loadContact(id);
    }
  }

  loadContact(id: string): void {
    this.loading = true;
    this.contactsService.getById(id).subscribe({
      next: (contact: Contact) => {
        this.form.patchValue({
          name: contact.name,
          email: contact.email || '',
          phone: contact.phone || '',
          companyId: contact.companyId || '',
          birthDate: contact.birthDate ? contact.birthDate.substring(0, 10) : '',
          status: contact.status,
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Contato não encontrado.';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.error = null;

    const value = this.form.value;
    const payload: Partial<Contact> = {
      name: value.name,
      status: value.status,
      ...(value.email && { email: value.email }),
      ...(value.phone && { phone: value.phone }),
      ...(value.companyId && { companyId: value.companyId }),
      ...(value.birthDate && { birthDate: value.birthDate }),
    };

    const request$ = this.isEdit && this.contactId
      ? this.contactsService.update(this.contactId, payload)
      : this.contactsService.create(payload);

    request$.subscribe({
      next: (contact) => {
        this.saving = false;
        this.router.navigate(['/contacts', contact.id]);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Erro ao salvar contato. Tente novamente.';
      },
    });
  }

  cancel(): void {
    if (this.isEdit && this.contactId) {
      this.router.navigate(['/contacts', this.contactId]);
    } else {
      this.router.navigate(['/contacts']);
    }
  }
}
