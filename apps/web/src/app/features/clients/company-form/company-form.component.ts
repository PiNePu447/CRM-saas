import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CompaniesService, Company } from '../../../core/services/companies.service';
import { TeamService, TeamUser } from '../../../core/services/team.service';

export type CompanyStatusOption = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'CHURNED';

export interface CompanyFormData {
  name: string;
  domain: string;
  industry: string;
  size: string;
  status: CompanyStatusOption;
  ownerId: string | null;
}

@Component({
  standalone: false,
  selector: 'app-company-form',
  templateUrl: './company-form.component.html',
})
export class CompanyFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() company: Company | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Company>();

  form: CompanyFormData = { name: '', domain: '', industry: '', size: '', status: 'PROSPECT', ownerId: null };
  saving = false;
  error = '';
  sellers: TeamUser[] = [];

  readonly sizeOptions = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
  readonly statusOptions: { value: CompanyStatusOption; label: string }[] = [
    { value: 'PROSPECT', label: 'Prospecto' },
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' },
    { value: 'CHURNED', label: 'Churn' },
  ];

  constructor(
    private readonly companiesService: CompaniesService,
    private readonly teamService: TeamService,
    readonly authService: AuthService,
  ) {}

  get isEdit(): boolean {
    return !!this.company;
  }

  get isAdminOrManager(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      if (this.company) {
        this.form = {
          name: this.company.name,
          domain: this.company.domain ?? '',
          industry: this.company.industry ?? '',
          size: this.company.size ?? '',
          status: (this.company.status as CompanyStatusOption) ?? 'PROSPECT',
          ownerId: this.company.ownerId ?? null,
        };
      } else {
        this.form = { name: '', domain: '', industry: '', size: '', status: 'PROSPECT', ownerId: null };
      }
      this.error = '';

      // Load sellers for owner picker (admin/manager only)
      if (this.isAdminOrManager) {
        this.teamService.list().subscribe({
          next: (users) => { this.sellers = users.filter(u => u.role === 'SELLER'); },
        });
      }
    }
  }

  submit(): void {
    if (!this.form.name.trim()) {
      this.error = 'Nome da empresa é obrigatório.';
      return;
    }

    this.saving = true;
    this.error = '';

    const payload = {
      name: this.form.name.trim(),
      status: this.form.status,
      ...(this.form.domain.trim() && { domain: this.form.domain.trim() }),
      ...(this.form.industry.trim() && { industry: this.form.industry.trim() }),
      ...(this.form.size && { size: this.form.size }),
      ownerId: this.form.ownerId,
    };

    const request$ = this.isEdit
      ? this.companiesService.update(this.company!.id, payload)
      : this.companiesService.create(payload);

    request$.subscribe({
      next: (result) => {
        this.saving = false;
        this.saved.emit(result);
      },
      error: () => {
        this.saving = false;
        this.error = 'Erro ao salvar empresa. Tente novamente.';
      },
    });
  }

  close(): void {
    if (!this.saving) this.closed.emit();
  }
}
